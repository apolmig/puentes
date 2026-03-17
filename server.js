const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const seedStore = require("./seed-data");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "store.json");
const staticFiles = new Set(["index.html", "styles.css", "script.js"]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};
const allowedStateKeys = new Set([
  "selectedAudienceId",
  "selectedPacketId",
  "selectedClaimIndex",
  "selectedFormat",
  "reviewStatus",
  "queue",
  "checklist",
  "reviewerNotes"
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureStoreFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(seedStore, null, 2));
  }
}

function loadStore() {
  ensureStoreFile();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function saveStore(store) {
  store.state.lastSavedAt = new Date().toISOString();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function appendHistory(store, action, detail) {
  if (!action) {
    return;
  }
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    action,
    detail: detail || ""
  };
  store.state.history = [entry, ...(store.state.history || [])].slice(0, 12);
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

function sanitizeChecklist(checklist) {
  if (!Array.isArray(checklist)) {
    return clone(seedStore.state.checklist);
  }
  return checklist.map((item, index) => ({
    id: typeof item.id === "string" ? item.id : `item-${index}`,
    label: typeof item.label === "string" ? item.label : "Checklist item",
    done: Boolean(item.done)
  }));
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/bootstrap") {
    const store = loadStore();
    sendJson(response, 200, store);
    return;
  }

  if (request.method === "POST" && pathname === "/api/state") {
    const body = await readBody(request);
    const patch = body.patch && typeof body.patch === "object" ? body.patch : {};
    const store = loadStore();
    const nextState = { ...store.state };

    for (const [key, value] of Object.entries(patch)) {
      if (!allowedStateKeys.has(key)) {
        continue;
      }
      if (key === "checklist") {
        nextState.checklist = sanitizeChecklist(value);
      } else if (key === "selectedClaimIndex") {
        nextState.selectedClaimIndex = Number.isInteger(value) ? value : Number(value) || 0;
      } else {
        nextState[key] = value;
      }
    }

    store.state = nextState;
    appendHistory(store, body.action, body.detail);
    saveStore(store);
    sendJson(response, 200, { state: store.state });
    return;
  }

  if (request.method === "POST" && pathname === "/api/queue") {
    const body = await readBody(request);
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) {
      sendJson(response, 400, { error: "Question is required." });
      return;
    }

    const store = loadStore();
    store.state.queue = [question, ...(store.state.queue || [])].slice(0, 8);
    appendHistory(store, "Queued question", question);
    saveStore(store);
    sendJson(response, 200, { state: store.state });
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

function serveStatic(response, pathname) {
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
    sendJson(response, 500, { error: error.message || "Internal server error" });
  }
});

ensureStoreFile();
server.listen(port, host, () => {
  console.log(`Puentes listening on http://${host}:${port}`);
});
