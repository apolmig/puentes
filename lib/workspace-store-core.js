const seedStore = require("../seed-data");

const audienceMap = new Map(seedStore.audiences.map((audience) => [audience.id, audience]));
const packetMap = new Map(seedStore.packets.map((packet) => [packet.id, packet]));
const defaultPacketId = seedStore.workspace.activePacketId;
const packagingPresetIds = new Set([
  "fast_myth_check",
  "context_carousel",
  "comment_deescalator",
  "teacher_safe"
]);
const defaultAiSettings = {
  textModel: "gpt-5",
  reviewModel: "gpt-5-mini",
  imageModel: "gpt-image-1.5",
  videoModel: "sora-2"
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
    .slice(0, 16);

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

function normalizeAiSettings(aiSettings = {}) {
  const source = aiSettings && typeof aiSettings === "object" ? aiSettings : {};
  const defaults = {
    ...defaultAiSettings,
    ...(seedStore.createWorkspaceState(defaultPacketId).aiSettings || {})
  };
  return {
    textModel: sanitizeInlineText(source.textModel, 80) || defaults.textModel,
    reviewModel: sanitizeInlineText(source.reviewModel, 80) || defaults.reviewModel,
    imageModel: sanitizeInlineText(source.imageModel, 80) || defaults.imageModel,
    videoModel: sanitizeInlineText(source.videoModel, 80) || defaults.videoModel
  };
}

function normalizePackagingPreset(value, fallback = seedStore.createWorkspaceState(defaultPacketId).packagingPreset) {
  const safeFallback = packagingPresetIds.has(fallback) ? fallback : "fast_myth_check";
  const candidate = sanitizeInlineText(value, 80) || safeFallback;
  return packagingPresetIds.has(candidate) ? candidate : safeFallback;
}

function normalizeAngleOptions(angleOptions) {
  if (!Array.isArray(angleOptions)) {
    return [];
  }

  return angleOptions
    .map((angle) => {
      if (!angle || typeof angle !== "object") {
        return null;
      }

      return {
        label: sanitizeInlineText(angle.label, 60),
        hook: sanitizeNoteText(angle.hook, 220),
        audienceFit: sanitizeNoteText(angle.audienceFit, 220),
        riskNote: sanitizeNoteText(angle.riskNote, 220),
        avoidWhen: sanitizeNoteText(angle.avoidWhen, 220)
      };
    })
    .filter((angle) => angle && angle.label)
    .slice(0, 3);
}

function normalizeIntakeBrief(brief) {
  if (!brief || typeof brief !== "object") {
    return null;
  }

  return {
    summary: sanitizeNoteText(brief.summary, 320),
    peopleThink: sanitizeNoteText(brief.peopleThink, 320),
    recordSays: sanitizeNoteText(brief.recordSays, 320),
    missing: sanitizeNoteText(brief.missing, 320),
    recommendedPacketId: packetMap.has(brief.recommendedPacketId) ? brief.recommendedPacketId : "",
    recommendedClaimIndex: Number.isInteger(brief.recommendedClaimIndex) ? brief.recommendedClaimIndex : 0,
    model: sanitizeInlineText(brief.model, 80),
    generatedAt: validTimestamp(brief.generatedAt, new Date().toISOString())
  };
}

function normalizeClaimMap(map) {
  if (!map || typeof map !== "object") {
    return null;
  }

  return {
    framing: sanitizeNoteText(map.framing, 320),
    supportedPoints: normalizeGeneratedList(map.supportedPoints, 4, 220),
    openQuestions: normalizeGeneratedList(map.openQuestions, 4, 220),
    languageRisks: normalizeGeneratedList(map.languageRisks, 4, 220),
    model: sanitizeInlineText(map.model, 80),
    generatedAt: validTimestamp(map.generatedAt, new Date().toISOString())
  };
}

function normalizeReviewFindings(findings) {
  if (!findings || typeof findings !== "object") {
    return null;
  }

  return {
    verdict: sanitizeInlineText(findings.verdict, 80) || "review-needed",
    summary: sanitizeNoteText(findings.summary, 400),
    strengths: normalizeGeneratedList(findings.strengths, 4, 220),
    risks: normalizeGeneratedList(findings.risks, 5, 220),
    fixes: normalizeGeneratedList(findings.fixes, 5, 220),
    model: sanitizeInlineText(findings.model, 80),
    generatedAt: validTimestamp(findings.generatedAt, new Date().toISOString())
  };
}

function normalizeGenerationRuns(runs) {
  if (!Array.isArray(runs)) {
    return [];
  }

  return runs
    .map((run, index) => {
      const type = sanitizeInlineText(run?.type, 60);
      if (!type) {
        return null;
      }

      return {
        id: sanitizeInlineText(run?.id, 80) || `run-${index}`,
        type,
        status: sanitizeInlineText(run?.status, 40) || "ready",
        model: sanitizeInlineText(run?.model, 80),
        target: sanitizeInlineText(run?.target, 120),
        generatedAt: validTimestamp(run?.generatedAt, new Date().toISOString())
      };
    })
    .filter(Boolean)
    .slice(0, 24);
}

function normalizeWorkspaceState(packetId, candidate = {}) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const packet = packetMap.get(packetId);
  const defaults = seedStore.createWorkspaceState(packetId);
  const audienceId = resolveAudienceId(source.selectedAudienceId);
  const requestedFormat = typeof source.selectedFormat === "string" ? source.selectedFormat : "";
  const selectedFormat = packet?.outputBundles[requestedFormat]
    ? requestedFormat
    : resolveDefaultFormat(audienceId);
  const reviewStatus = ["pending", "approved", "revision"].includes(source.reviewStatus)
    ? source.reviewStatus
    : "pending";
  const nextClaimIndex = Number(source.selectedClaimIndex);
  const angleOptions = normalizeAngleOptions(source.angleOptions);
  const defaultAngleIndex = Number.isInteger(defaults.selectedAngleIndex) ? defaults.selectedAngleIndex : 0;
  const selectedClaimIndex = Number.isInteger(nextClaimIndex)
    ? Math.max(0, Math.min(nextClaimIndex, (packet?.claims.length || 1) - 1))
    : defaults.selectedClaimIndex;

  return {
    ...defaults,
    selectedAudienceId: audienceId,
    selectedClaimIndex,
    selectedFormat,
    reviewStatus,
    checklist: normalizeChecklist(source.checklist),
    reviewerNotes: sanitizeNoteText(source.reviewerNotes),
    history: normalizeHistory(source.history, packetId),
    exportedFormats: Array.isArray(source.exportedFormats)
      ? [...new Set(source.exportedFormats.filter((format) => packet?.outputBundles[format]))]
      : [],
    shareReady: Boolean(source.shareReady),
    shareUrl: sanitizeInlineText(source.shareUrl, 320),
    packagingPreset: normalizePackagingPreset(source.packagingPreset, defaults.packagingPreset),
    generatedBundlesByFormat: normalizeGeneratedBundles(source.generatedBundlesByFormat, packetId),
    aiSettings: normalizeAiSettings(source.aiSettings),
    intakeBrief: normalizeIntakeBrief(source.intakeBrief),
    claimMap: normalizeClaimMap(source.claimMap),
    angleOptions,
    selectedAngleIndex: Number.isInteger(source.selectedAngleIndex)
      ? Math.max(0, Math.min(source.selectedAngleIndex, Math.max(angleOptions.length - 1, 0)))
      : Math.max(0, Math.min(defaultAngleIndex, Math.max(angleOptions.length - 1, 0))),
    reviewFindings: normalizeReviewFindings(source.reviewFindings),
    generationRuns: normalizeGenerationRuns(source.generationRuns)
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
    meta: { version: 4 },
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

  workspace.history = [entry, ...(workspace.history || [])].slice(0, 16);
}

function updateWorkspaceStore(store, body) {
  const appPatch = body.appPatch && typeof body.appPatch === "object" ? body.appPatch : {};
  const workspacePatch = body.workspacePatch && typeof body.workspacePatch === "object" ? body.workspacePatch : {};

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
  store.workspace.lastSavedAt = new Date().toISOString();
  return normalizeStore(store);
}

function queueQuestion(store, body) {
  const question = sanitizeInlineText(body.question, 240);
  if (!question) {
    const error = new Error("Question is required.");
    error.statusCode = 400;
    throw error;
  }

  store.workspace.queue = [question, ...(store.workspace.queue || [])].slice(0, 8);
  appendHistory(store, store.workspace.activePacketId, "Queued question", question);
  store.workspace.lastSavedAt = new Date().toISOString();
  return normalizeStore(store);
}

module.exports = {
  clone,
  normalizeStore,
  updateWorkspaceStore,
  queueQuestion
};
