const assert = require("node:assert/strict");
const test = require("node:test");

const {
  downloadVideoAsset,
  sanitizeVideoId
} = require("../netlify/functions/_lib/openai");

function loadVideoHandler(fileName, openAiExports) {
  const handlerPath = require.resolve(`../netlify/functions/${fileName}`);
  const openAiPath = require.resolve("../netlify/functions/_lib/openai");
  const actualOpenAi = require(openAiPath);
  const previousOpenAiCache = require.cache[openAiPath];

  delete require.cache[handlerPath];
  require.cache[openAiPath] = {
    id: openAiPath,
    filename: openAiPath,
    loaded: true,
    exports: {
      ...actualOpenAi,
      ...openAiExports
    }
  };

  const loaded = require(handlerPath);

  return {
    handler: loaded.handler,
    restore() {
      delete require.cache[handlerPath];
      if (previousOpenAiCache) {
        require.cache[openAiPath] = previousOpenAiCache;
      } else {
        delete require.cache[openAiPath];
      }
    }
  };
}

function getEvent(queryStringParameters = {}) {
  return {
    httpMethod: "GET",
    queryStringParameters
  };
}

function parseJson(response) {
  return JSON.parse(response.body);
}

test("video-status validates that a video id is present before upstream lookup", async () => {
  let upstreamCalled = false;
  const { handler, restore } = loadVideoHandler("video-status.js", {
    async getVideoJob() {
      upstreamCalled = true;
      return { id: "video-unused" };
    }
  });

  try {
    const response = await handler(getEvent());

    assert.equal(response.statusCode, 400);
    assert.equal(parseJson(response).error, "Video id is required.");
    assert.equal(upstreamCalled, false);
  } finally {
    restore();
  }
});

test("video-status rejects malformed video ids before upstream lookup", async () => {
  let upstreamCalled = false;
  const { handler, restore } = loadVideoHandler("video-status.js", {
    async getVideoJob() {
      upstreamCalled = true;
      return { id: "video-unused" };
    }
  });

  try {
    const response = await handler(getEvent({ id: "video_abc12345/../other" }));

    assert.equal(response.statusCode, 400);
    assert.equal(parseJson(response).error, "Invalid video id.");
    assert.equal(upstreamCalled, false);
  } finally {
    restore();
  }
});

test("video id sanitizer rejects path traversal values", () => {
  assert.equal(sanitizeVideoId("video_abc12345"), "video_abc12345");
  assert.throws(() => sanitizeVideoId("../models"), /Invalid video id/);
  assert.throws(() => sanitizeVideoId("video_abc12345/../models"), /Invalid video id/);
});

test("video-download validates that a video id is present before upstream download", async () => {
  let upstreamCalled = false;
  const { handler, restore } = loadVideoHandler("video-download.js", {
    async downloadVideoAsset() {
      upstreamCalled = true;
      return {
        body: Buffer.from("unused"),
        headers: new Headers()
      };
    }
  });

  try {
    const response = await handler(getEvent({ variant: "video" }));

    assert.equal(response.statusCode, 400);
    assert.equal(parseJson(response).error, "Video id is required.");
    assert.equal(upstreamCalled, false);
  } finally {
    restore();
  }
});

test("video-status returns encoded download URLs for a valid mocked video id", async () => {
  const videoId = "video_abc12345";
  const { handler, restore } = loadVideoHandler("video-status.js", {
    async getVideoJob(id) {
      assert.equal(id, videoId);
      return { id, status: "completed" };
    }
  });

  try {
    const response = await handler(getEvent({ id: videoId }));
    const body = parseJson(response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(body.video, { id: videoId, status: "completed" });
    assert.equal(body.download.video, `/.netlify/functions/video-download?id=${encodeURIComponent(videoId)}&variant=video`);
    assert.equal(body.download.thumbnail, `/.netlify/functions/video-download?id=${encodeURIComponent(videoId)}&variant=thumbnail`);
    assert.equal(body.download.spritesheet, `/.netlify/functions/video-download?id=${encodeURIComponent(videoId)}&variant=spritesheet`);
  } finally {
    restore();
  }
});

test("video download reader enforces max bytes while streaming", async () => {
  const previousApiKey = process.env.OPENAI_API_KEY;
  const previousMaxBytes = process.env.PUENTES_VIDEO_DOWNLOAD_MAX_BYTES;
  const previousFetch = global.fetch;

  process.env.OPENAI_API_KEY = "test-key";
  process.env.PUENTES_VIDEO_DOWNLOAD_MAX_BYTES = "8";
  global.fetch = async () => new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70]));
        controller.enqueue(new Uint8Array(4));
        controller.close();
      }
    }),
    {
      status: 200,
      headers: {
        "content-type": "video/mp4"
      }
    }
  );

  try {
    await assert.rejects(
      () => downloadVideoAsset("video_abc12345", "video"),
      /exceeds the configured download size limit/
    );
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousApiKey;
    }
    if (previousMaxBytes === undefined) {
      delete process.env.PUENTES_VIDEO_DOWNLOAD_MAX_BYTES;
    } else {
      process.env.PUENTES_VIDEO_DOWNLOAD_MAX_BYTES = previousMaxBytes;
    }
    global.fetch = previousFetch;
  }
});
