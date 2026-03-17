const fs = require("fs");
const path = require("path");
const seedStore = require("../../../seed-data");
const { createError } = require("./http");

const rootDir = path.resolve(__dirname, "../../..");
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "store.json");
const audienceMap = new Map(seedStore.audiences.map((audience) => [audience.id, audience]));
const packetMap = new Map(seedStore.packets.map((packet) => [packet.id, packet]));
const defaultPacketId = seedStore.workspace.activePacketId;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function useFileStore() {
  return process.env.PUENTES_STORE_BACKEND === "file";
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

function normalizeGeneratedList(list, maxItems = 6, maxLength = 240) {
  return Array.isArray(list)
    ? list.map((item) => sanitizeInlineText(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function normalizeGeneratedBundles(generatedBundles, packetId) {
  const packet = packetMap.get(packetId);
  if (!packet || !generatedBundles || typeof generatedBundles !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(generatedBundles)
      .filter(([format, bundle]) => packet.outputBundles[format] && bundle && typeof bundle === "object")
      .map(([format, bundle]) => {
        const fallback = packet.outputBundles[format];
        return [format, {
          label: sanitizeInlineText(bundle.label, 80) || `AI ${fallback.label}`,
          title: sanitizeInlineText(bundle.title, 180) || fallback.title,
          hook: sanitizeNoteText(bundle.hook, 320) || fallback.hook,
          caption: sanitizeNoteText(bundle.caption, 1200) || fallback.caption,
          script: sanitizeNoteText(bundle.script, 1600) || fallback.script,
          slides: normalizeGeneratedList(bundle.slides, 6, 220).length
            ? normalizeGeneratedList(bundle.slides, 6, 220)
            : clone(fallback.slides),
          commentPrompt: sanitizeNoteText(bundle.commentPrompt, 320) || fallback.commentPrompt,
          citations: normalizeGeneratedList(bundle.citations, 6, 180).length
            ? normalizeGeneratedList(bundle.citations, 6, 180)
            : clone(fallback.citations),
          shareSummary: sanitizeInlineText(bundle.shareSummary, 240) || fallback.shareSummary,
          note: sanitizeNoteText(bundle.note, 600) || fallback.note,
          visualBrief: sanitizeNoteText(bundle.visualBrief, 700),
          videoBrief: sanitizeNoteText(bundle.videoBrief, 700),
          safetyNotes: normalizeGeneratedList(bundle.safetyNotes, 5, 220),
          model: sanitizeInlineText(bundle.model, 80),
          responseId: sanitizeInlineText(bundle.responseId, 120),
          generatedAt: validTimestamp(bundle.generatedAt, new Date().toISOString())
        }];
      })
  );
}

function normalizeWorkspaceState(packetId, candidate = {}) {
  const packet = packetMap.get(packetId);
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
    shareUrl: sanitizeInlineText(candidate.shareUrl, 320),
    generatedBundlesByFormat: normalizeGeneratedBundles(candidate.generatedBundlesByFormat, packetId)
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
    meta: { version: 3 },
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
  if (!useFileStore()) {
    return normalizeStore(seedStore);
  }

  ensureStoreFile();
  return normalizeStore(JSON.parse(fs.readFileSync(dataFile, "utf8")));
}

function saveStore(store) {
  const normalized = normalizeStore(store);
  normalized.workspace.lastSavedAt = new Date().toISOString();

  if (useFileStore()) {
    ensureStoreFile();
    fs.writeFileSync(dataFile, JSON.stringify(normalized, null, 2));
  }

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

function assertPersistentStore() {
  if (!useFileStore()) {
    throw createError(
      501,
      "Persistent workspace storage is not configured for Netlify Functions. Keep using local demo mode or add a real database adapter."
    );
  }
}

function updateWorkspaceStore(body) {
  assertPersistentStore();

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
  return saveStore(store);
}

function queueQuestion(body) {
  assertPersistentStore();

  const question = sanitizeInlineText(body.question, 240);
  if (!question) {
    throw createError(400, "Question is required.");
  }

  const store = loadStore();
  store.workspace.queue = [question, ...(store.workspace.queue || [])].slice(0, 8);
  appendHistory(store, store.workspace.activePacketId, "Queued question", question);
  return saveStore(store);
}

module.exports = {
  loadStore,
  updateWorkspaceStore,
  queueQuestion,
  useFileStore
};

