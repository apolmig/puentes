const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const seedStore = require("./seed-data");
const { normalizeStore, updateWorkspaceStore, queueQuestion } = require("./lib/workspace-store-core");
const { getPublicAiConfig } = require("./lib/model-config");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "store.json");
const staticFiles = new Set(["index.html", "styles.css", "script.js", "seed-data.js"]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function localNetlifyDevRuntime() {
  return process.env.NETLIFY_DEV === "true" || process.env.CONTEXT === "dev";
}

function fileWritesBlockedOnHostedNetlify() {
  return !localNetlifyDevRuntime()
    && (
      process.env.NETLIFY === "true"
      || ["production", "deploy-preview", "branch-deploy"].includes(process.env.CONTEXT)
    );
}

function assertFileStoreWritable() {
  if (fileWritesBlockedOnHostedNetlify()) {
    throw new Error("File workspace storage is disabled on hosted Netlify. Use local dev or configure a persistent adapter.");
  }
}

function ensureDataDir() {
  assertFileStoreWritable();

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function seedWorkspaceStore() {
  return normalizeStore(seedStore);
}

function writeJsonFileAtomic(filePath, payload) {
  ensureDataDir();

  const dir = path.dirname(filePath);
  const tempFile = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
  );

  try {
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), "utf8");
    fs.renameSync(tempFile, filePath);
  } catch (error) {
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (cleanupError) {
      console.warn(`Failed to remove temp store file ${tempFile}: ${cleanupError.message}`);
    }
    throw error;
  }
}

function backupCorruptStoreFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = `${filePath}.corrupt-${stamp}-${process.pid}`;

  try {
    fs.renameSync(filePath, backupFile);
  } catch (error) {
    console.warn(`Failed to move corrupt store file aside: ${error.message}`);
  }
}

function recoverStoreFile(error) {
  console.warn(`Recovering workspace store from seed data: ${error.message}`);
  backupCorruptStoreFile(dataFile);
  const fallback = seedWorkspaceStore();
  writeJsonFileAtomic(dataFile, fallback);
  return fallback;
}

function ensureStoreFile() {
  ensureDataDir();

  if (!fs.existsSync(dataFile)) {
    writeJsonFileAtomic(dataFile, seedWorkspaceStore());
  }
}

function loadStore() {
  ensureStoreFile();

  try {
    return normalizeStore(JSON.parse(fs.readFileSync(dataFile, "utf8")));
  } catch (error) {
    return recoverStoreFile(error);
  }
}

function saveStore(store) {
  const normalized = normalizeStore(store);
  writeJsonFileAtomic(dataFile, normalized);
  return normalized;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(text);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Body too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    request.on("error", reject);
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/bootstrap") {
    sendJson(response, 200, {
      ...loadStore(),
      backend: { mode: "file" },
      ai: getPublicAiConfig()
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/ai-config") {
    sendJson(response, 200, getPublicAiConfig());
    return;
  }

  if (request.method === "POST" && pathname === "/api/state") {
    const body = await readBody(request);
    const savedStore = saveStore(updateWorkspaceStore(loadStore(), body));
    sendJson(response, 200, { workspace: savedStore.workspace });
    return;
  }

  if (request.method === "POST" && pathname === "/api/queue") {
    const body = await readBody(request);
    const savedStore = saveStore(queueQuestion(loadStore(), body));
    sendJson(response, 200, { workspace: savedStore.workspace });
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

function serveStatic(response, pathname) {
  if (pathname === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }

  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const relativePath = cleanPath.replace(/^\/+/, "");

  if (!staticFiles.has(relativePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  const filePath = path.join(rootDir, relativePath);
  const extension = path.extname(filePath);
  const contentType = contentTypes[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, file) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    response.end(file);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${host}:${port}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname);
      return;
    }

    serveStatic(response, url.pathname);
  } catch (error) {
    sendJson(response, error.statusCode || 500, { error: error.message || "Internal server error" });
  }
});

loadStore();
server.listen(port, host, () => {
  console.log(`Puentes listening on http://${host}:${port}`);
});
