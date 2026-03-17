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
const staticFiles = new Set(["index.html", "styles.css", "script.js", "seed-data.js"]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const audienceMap = new Map(seedStore.audiences.map((audience) => [audience.id, audience]));
const packetMap = new Map(seedStore.packets.map((packet) => [packet.id, packet]));
const defaultPacketId = seedStore.workspace.activePacketId;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getPacket(packetId) {
  return packetMap.get(packetId);
}

function sanitizeInlineText(value, maxLength = 280) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeNoteText(value, maxLength = 1200) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validTimestamp(value, fallback = seedStore.workspace.lastSavedAt) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function resolveAudienceId(value) {
  return audienceMap.has(value) ? value : "creator";
}

function resolveDefaultFormat(audienceId) {
  return audienceMap.get(audienceId)?.defaultFormat || "creator";
}

function normalizeChecklist(checklist) {
  const overrides = new Map(
    Array.isArray(checklist)
      ? checklist.map((item) => [item?.id, Boolean(item?.done)])
      : []
  );

  return clone(seedStore.baseChecklist).map((item) => ({
    ...item,
    done: overrides.has(item.id) ? overrides.get(item.id) : false
  }));
}

function normalizeHistory(history, packetId) {
  if (!Array.isArray(history)) {
    return clone(seedStore.createWorkspaceState(packetId).history);
  }

  const normalized = history
    .map((entry, index) => {
      const action = sanitizeInlineText(entry?.action, 100);
      const detail = sanitizeInlineText(entry?.detail, 240);

      if (!action) {
        return null;
      }

      return {
        id: sanitizeInlineText(entry?.id, 80) || `${packetId}-entry-${index}`,
        timestamp: validTimestamp(entry?.timestamp, new Date().toISOString()),
        action,
        detail
      };
    })
    .filter(Boolean)
    .slice(0, 12);

  return normalized.length ? normalized : clone(seedStore.createWorkspaceState(packetId).history);
}

function normalizeQueue(queue) {
  if (!Array.isArray(queue)) {
    return clone(seedStore.workspace.queue);
  }

  return queue
    .map((item) => sanitizeInlineText(item, 240))
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeWorkspaceState(packetId, candidate = {}) {
  const packet = getPacket(packetId);
  const defaults = seedStore.createWorkspaceState(packetId);
  const audienceId = resolveAudienceId(candidate.selectedAudienceId);
  const requestedFormat = typeof candidate.selectedFormat === "string" ? candidate.selectedFormat : "";
  const selectedFormat = packet?.outputBundles[requestedFormat]
    ? requestedFormat
    : resolveDefaultFormat(audienceId);
  const reviewStatus = ["pending", "approved", "revision"].includes(candidate.reviewStatus)
    ? candidate.reviewStatus
    : "pending";
  const nextClaimIndex = Number(candidate.selectedClaimIndex);
  const selectedClaimIndex = Number.isInteger(nextClaimIndex)
    ? Math.max(0, Math.min(nextClaimIndex, (packet?.claims.length || 1) - 1))
    : defaults.selectedClaimIndex;

  return {
    ...defaults,
    selectedAudienceId: audienceId,
    selectedClaimIndex,
    selectedFormat,
    reviewStatus,
    checklist: normalizeChecklist(candidate.checklist),
    reviewerNotes: sanitizeNoteText(candidate.reviewerNotes),
    history: normalizeHistory(candidate.history, packetId),
    exportedFormats: Array.isArray(candidate.exportedFormats)
      ? [...new Set(candidate.exportedFormats.filter((format) => packet?.outputBundles[format]))]
      : [],
    shareReady: Boolean(candidate.shareReady),
    shareUrl: sanitizeInlineText(candidate.shareUrl, 320)
  };
}

function normalizeStore(rawStore = {}) {
  const sourceWorkspace = rawStore && typeof rawStore.workspace === "object" ? rawStore.workspace : null;
  const legacyState = rawStore && typeof rawStore.state === "object" ? rawStore.state : null;
  const activePacketCandidate = sourceWorkspace?.activePacketId || legacyState?.selectedPacketId || defaultPacketId;
  const activePacketId = packetMap.has(activePacketCandidate) ? activePacketCandidate : defaultPacketId;
  const queueSource = sourceWorkspace && Object.prototype.hasOwnProperty.call(sourceWorkspace, "queue")
    ? sourceWorkspace.queue
    : legacyState?.queue;
  const queue = normalizeQueue(queueSource);
  const workspaceStateByPacket = {};

  for (const packet of seedStore.packets) {
    let candidate = sourceWorkspace?.workspaceStateByPacket?.[packet.id];

    if (!candidate && legacyState && packet.id === activePacketId) {
      candidate = {
        selectedAudienceId: legacyState.selectedAudienceId,
        selectedClaimIndex: legacyState.selectedClaimIndex,
        selectedFormat: legacyState.selectedFormat,
        reviewStatus: legacyState.reviewStatus,
        checklist: legacyState.checklist,
        reviewerNotes: legacyState.reviewerNotes,
        history: legacyState.history
      };
    }

    workspaceStateByPacket[packet.id] = normalizeWorkspaceState(packet.id, candidate);
  }

  return {
    meta: { version: 2 },
    audiences: clone(seedStore.audiences),
    packets: clone(seedStore.packets),
    workspace: {
      activePacketId,
      queue,
      workspaceStateByPacket,
      lastSavedAt: validTimestamp(sourceWorkspace?.lastSavedAt || legacyState?.lastSavedAt)
    }
  };
}

function ensureStoreFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(normalizeStore(seedStore), null, 2));
  }
}

function loadStore() {
  ensureStoreFile();
  return normalizeStore(JSON.parse(fs.readFileSync(dataFile, "utf8")));
}

function saveStore(store) {
  const normalized = normalizeStore(store);
  normalized.workspace.lastSavedAt = new Date().toISOString();
  fs.writeFileSync(dataFile, JSON.stringify(normalized, null, 2));
  return normalized;
}

function appendHistory(store, packetId, action, detail) {
  const workspace = store.workspace.workspaceStateByPacket[packetId];

  if (!workspace) {
    return;
  }

  const safeAction = sanitizeInlineText(action, 100);
  if (!safeAction) {
    return;
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    action: safeAction,
    detail: sanitizeInlineText(detail, 240)
  };

  workspace.history = [entry, ...(workspace.history || [])].slice(0, 12);
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
    sendJson(response, 200, loadStore());
    return;
  }

  if (request.method === "POST" && pathname === "/api/state") {
    const body = await readBody(request);
    const appPatch = body.appPatch && typeof body.appPatch === "object" ? body.appPatch : {};
    const workspacePatch = body.workspacePatch && typeof body.workspacePatch === "object" ? body.workspacePatch : {};
    const store = loadStore();

    if (packetMap.has(appPatch.activePacketId)) {
      store.workspace.activePacketId = appPatch.activePacketId;
    }

    if (Object.prototype.hasOwnProperty.call(appPatch, "queue")) {
      store.workspace.queue = normalizeQueue(appPatch.queue);
    }

    const targetPacketId = packetMap.has(body.packetId) ? body.packetId : store.workspace.activePacketId;
    const currentWorkspace = store.workspace.workspaceStateByPacket[targetPacketId]
      || seedStore.createWorkspaceState(targetPacketId);
    const nextWorkspace = { ...currentWorkspace, ...workspacePatch };

    if (Object.prototype.hasOwnProperty.call(workspacePatch, "selectedAudienceId")
      && !Object.prototype.hasOwnProperty.call(workspacePatch, "selectedFormat")) {
      nextWorkspace.selectedFormat = resolveDefaultFormat(resolveAudienceId(workspacePatch.selectedAudienceId));
    }

    if (Object.keys(workspacePatch).length) {
      store.workspace.workspaceStateByPacket[targetPacketId] = normalizeWorkspaceState(targetPacketId, nextWorkspace);
    }

    appendHistory(store, targetPacketId, body.action, body.detail);
    const savedStore = saveStore(store);
    sendJson(response, 200, { workspace: savedStore.workspace });
    return;
  }

  if (request.method === "POST" && pathname === "/api/queue") {
    const body = await readBody(request);
    const question = sanitizeInlineText(body.question, 240);

    if (!question) {
      sendJson(response, 400, { error: "Question is required." });
      return;
    }

    const store = loadStore();
    store.workspace.queue = [question, ...(store.workspace.queue || [])].slice(0, 8);
    appendHistory(store, store.workspace.activePacketId, "Queued question", question);
    const savedStore = saveStore(store);
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
    sendJson(response, 500, { error: error.message || "Internal server error" });
  }
});

ensureStoreFile();
server.listen(port, host, () => {
  console.log(`Puentes listening on http://${host}:${port}`);
});
