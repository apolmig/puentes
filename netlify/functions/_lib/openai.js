const { createError } = require("./http");

const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
const VIDEO_ID_PATTERN = /^video_[A-Za-z0-9_-]{8,128}$/;
const VIDEO_DOWNLOAD_VARIANTS = Object.freeze({
  video: {
    extension: "mp4",
    allowedContentTypes: ["video/mp4", "video/webm"]
  },
  thumbnail: {
    extension: "png",
    allowedContentTypes: ["image/png", "image/jpeg", "image/webp"]
  },
  spritesheet: {
    extension: "png",
    allowedContentTypes: ["image/png", "image/jpeg", "image/webp"]
  }
});
const DOWNLOAD_EXTENSIONS_BY_CONTENT_TYPE = Object.freeze({
  "video/mp4": "mp4",
  "video/webm": "webm",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp"
});
const DEFAULT_VIDEO_DOWNLOAD_MAX_BYTES = 4_500_000;
const DEFAULT_IMAGE_DOWNLOAD_MAX_BYTES = 2_000_000;

function requireApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw createError(500, "OPENAI_API_KEY is not configured.");
  }
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseContentLength(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function readBoundedBuffer(response, maxBytes) {
  const contentLength = parseContentLength(response.headers.get("content-length"));
  if (maxBytes && contentLength !== null && contentLength > maxBytes) {
    throw createError(413, "OpenAI asset exceeds the configured download size limit.");
  }

  if (!response.body?.getReader) {
    const body = Buffer.from(await response.arrayBuffer());
    if (maxBytes && body.length > maxBytes) {
      throw createError(413, "OpenAI asset exceeds the configured download size limit.");
    }
    return body;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = Buffer.from(value);
      totalBytes += chunk.length;
      if (maxBytes && totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        throw createError(413, "OpenAI asset exceeds the configured download size limit.");
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
}

function buildOpenAiUrl(pathSegments, query = {}) {
  const url = new URL(OPENAI_API_BASE);
  const basePath = url.pathname.replace(/\/+$/, "");
  const encodedPath = pathSegments.map((segment) => {
    if (typeof segment !== "string" || !segment) {
      throw createError(500, "Invalid OpenAI endpoint segment.");
    }
    return encodeURIComponent(segment);
  }).join("/");

  url.pathname = `${basePath}/${encodedPath}`;
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function parseError(response) {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw);
    return parsed.error?.message || raw;
  } catch (error) {
    return raw || `OpenAI request failed with status ${response.status}`;
  }
}

async function openaiRequest(pathSegments, options = {}) {
  requireApiKey();

  const response = await fetch(buildOpenAiUrl(pathSegments, options.query), {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      ...options.headers
    },
    body: options.body
  });

  if (!response.ok) {
    throw createError(response.status, await parseError(response));
  }

  if (options.responseType === "buffer") {
    return {
      body: await readBoundedBuffer(response, options.maxBytes),
      headers: response.headers
    };
  }

  return response.json();
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const textParts = [];

  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string") {
        textParts.push(part.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

async function createStructuredTextBundle({
  model,
  schemaName,
  schema,
  systemPrompt,
  userPayload
}) {
  const payload = await openaiRequest(["responses"], {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify(userPayload) }]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
          strict: true
        }
      }
    })
  });

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw createError(502, "OpenAI response did not include structured output text.");
  }

  return {
    model: payload.model,
    id: payload.id,
    output: JSON.parse(outputText)
  };
}

async function generateImageAsset({ model, prompt, size, quality, background, outputFormat }) {
  return openaiRequest(["images", "generations"], {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      background,
      output_format: outputFormat
    })
  });
}

async function createVideoJob({ model, prompt, size, seconds }) {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("seconds", String(seconds));

  return openaiRequest(["videos"], {
    method: "POST",
    body: form
  });
}

function sanitizeVideoId(videoId) {
  const value = typeof videoId === "string" ? videoId.trim() : "";
  if (!VIDEO_ID_PATTERN.test(value)) {
    throw createError(400, "Invalid video id.");
  }
  return value;
}

function sanitizeVideoVariant(variant = "video") {
  const value = String(variant || "video").trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(VIDEO_DOWNLOAD_VARIANTS, value)) {
    throw createError(400, "Invalid video download variant.");
  }
  return value;
}

function sniffContentType(body) {
  if (!Buffer.isBuffer(body) || body.length < 4) {
    return "";
  }

  if (body.length >= 8 && body.subarray(4, 8).toString("ascii") === "ftyp") {
    return "video/mp4";
  }
  if (body.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return "video/webm";
  }
  if (body.length >= 8 && body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (body.length >= 3 && body.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return "image/jpeg";
  }
  if (body.length >= 12 && body.subarray(0, 4).toString("ascii") === "RIFF" && body.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  return "";
}

function resolveContentType(variant, asset) {
  const config = VIDEO_DOWNLOAD_VARIANTS[variant];
  const upstreamType = String(asset.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (config.allowedContentTypes.includes(upstreamType)) {
    return upstreamType;
  }

  const sniffedType = sniffContentType(asset.body);
  if (config.allowedContentTypes.includes(sniffedType)) {
    return sniffedType;
  }

  if (!upstreamType || upstreamType === "application/octet-stream") {
    throw createError(502, `OpenAI ${variant} download did not include a supported media signature.`);
  }

  throw createError(502, `OpenAI ${variant} download returned unsupported content type ${upstreamType}.`);
}

function videoDownloadMaxBytes(variant) {
  const defaultBytes = variant === "video"
    ? DEFAULT_VIDEO_DOWNLOAD_MAX_BYTES
    : DEFAULT_IMAGE_DOWNLOAD_MAX_BYTES;

  return parsePositiveInt(
    process.env.PUENTES_VIDEO_DOWNLOAD_MAX_BYTES || process.env.PUENTES_MAX_VIDEO_DOWNLOAD_BYTES,
    defaultBytes
  );
}

function videoDownloadUrl(videoId, variant = "video") {
  const id = sanitizeVideoId(videoId);
  const safeVariant = sanitizeVideoVariant(variant);
  return `/.netlify/functions/video-download?id=${encodeURIComponent(id)}&variant=${encodeURIComponent(safeVariant)}`;
}

async function getVideoJob(videoId) {
  return openaiRequest(["videos", sanitizeVideoId(videoId)]);
}

async function downloadVideoAsset(videoId, variant) {
  const id = sanitizeVideoId(videoId);
  const safeVariant = sanitizeVideoVariant(variant);
  const asset = await openaiRequest(["videos", id, "content"], {
    query: { variant: safeVariant },
    responseType: "buffer",
    maxBytes: videoDownloadMaxBytes(safeVariant)
  });

  const contentType = resolveContentType(safeVariant, asset);
  const extension = DOWNLOAD_EXTENSIONS_BY_CONTENT_TYPE[contentType]
    || VIDEO_DOWNLOAD_VARIANTS[safeVariant].extension;

  return {
    body: asset.body,
    contentLength: asset.body.length,
    contentType,
    filename: `${id}-${safeVariant}.${extension}`,
    variant: safeVariant
  };
}

module.exports = {
  createStructuredTextBundle,
  generateImageAsset,
  createVideoJob,
  getVideoJob,
  downloadVideoAsset,
  sanitizeVideoId,
  sanitizeVideoVariant,
  videoDownloadUrl
};
