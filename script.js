const store = {
  audiences: [],
  packets: [],
  workspace: null
};

const STAGES = ["intake", "verify", "draft", "export"];
const LOCAL_STORAGE_KEY = "puentes-visual-demo-v3";
const MEDIA_STORAGE_KEY = "puentes-media-demo-v1";
const DEMO_VIDEO_DELAY_MS = 1800;
const elements = {};
let readonlyMode = false;
let feedbackTimer = null;
let persistenceMode = "api";
let activeStage = "intake";
let runtimeConfig = null;
const mediaState = { byPacket: {} };
const pendingState = { text: false, image: false, video: false };
const videoPollTimers = new Map();
const REFINE_PRESETS = {
  hook: {
    label: "Stronger hook",
    status: "Tightening the hook...",
    action: "Refined hook",
    instructions: [
      "Keep the factual spine, but make the opening hook sharper and more attention-worthy.",
      "Do not increase outrage or certainty just to be catchy."
    ]
  },
  caption: {
    label: "Tighter caption",
    status: "Shortening the caption...",
    action: "Refined caption",
    instructions: [
      "Shorten the caption and make it cleaner for social posting.",
      "Keep the strongest information density without sounding clipped."
    ]
  },
  receipts: {
    label: "More source visible",
    status: "Bringing the receipts forward...",
    action: "Refined source visibility",
    instructions: [
      "Make the sourcing and citation trail more visible inside the output.",
      "Keep the language natural while making the receipts easier to notice."
    ]
  },
  uncertainty: {
    label: "Clearer uncertainty",
    status: "Clarifying uncertainty...",
    action: "Refined uncertainty",
    instructions: [
      "Make what is still unknown or unresolved more explicit.",
      "Preserve clarity without sounding vague or evasive."
    ]
  }
};

const PACKAGING_PRESETS = {
  fast_myth_check: {
    label: "Fast myth check",
    instructions: [
      "Package this as a quick myth reset for short-form audiences.",
      "Lead with what people are getting wrong, then snap to the documented record."
    ]
  },
  context_carousel: {
    label: "Context carousel",
    instructions: [
      "Package this for a swipeable context carousel.",
      "Prioritize sequence, comparison, and what changed versus what stayed."
    ]
  },
  comment_deescalator: {
    label: "Comment-war de-escalator",
    instructions: [
      "Package this to cool down polarized comment sections.",
      "Avoid taking the bait of false binaries and give viewers a calmer way to talk about the issue."
    ]
  },
  teacher_safe: {
    label: "Teacher-safe explainer",
    instructions: [
      "Package this for educators or youth facilitators who need a room-safe explainer.",
      "Keep the tone grounded and the discussion prompt constructive."
    ]
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDefaultRuntimeConfig() {
  return {
    text: { provider: "openai", selectedModel: "gpt-5", availableModels: ["gpt-5", "gpt-5-mini"] },
    review: { provider: "openai", selectedModel: "gpt-5-mini", availableModels: ["gpt-5-mini", "gpt-5"] },
    image: { provider: "openai", selectedModel: "gpt-image-1.5", availableModels: ["gpt-image-1.5"] },
    video: { provider: "openai", selectedModel: "sora-2", availableModels: ["sora-2"] },
    apiKeysConfigured: { openai: false }
  };
}

function cacheElements() {
  Object.assign(elements, {
    saveStatus: document.getElementById("save-status"),
    sessionPacket: document.getElementById("session-packet"),
    sessionAudience: document.getElementById("session-audience"),
    sessionFormat: document.getElementById("session-format"),
    sessionModel: document.getElementById("session-model"),
    sessionNext: document.getElementById("session-next"),
    heroQuestion: document.getElementById("hero-question"),
    heroBefore: document.getElementById("hero-before"),
    heroAfter: document.getElementById("hero-after"),
    heroOutputLabel: document.getElementById("hero-output-label"),
    visualPacket: document.getElementById("visual-packet"),
    visualClaim: document.getElementById("visual-claim"),
    visualShareSummary: document.getElementById("visual-share-summary"),
    visualHook: document.getElementById("visual-hook"),
    visualSlides: document.getElementById("visual-slides"),
    visualComment: document.getElementById("visual-comment"),
    visualSource: document.getElementById("visual-source"),
    audienceTabs: document.getElementById("audience-tabs"),
    audienceKicker: document.getElementById("audience-kicker"),
    audienceTitle: document.getElementById("audience-title"),
    audienceSummary: document.getElementById("audience-summary"),
    audienceFocus: document.getElementById("audience-focus"),
    questionInput: document.getElementById("question-input"),
    queueList: document.getElementById("queue-list"),
    queueCount: document.getElementById("queue-count"),
    runHistoryList: document.getElementById("run-history-list"),
    packetList: document.getElementById("packet-list"),
    packetCount: document.getElementById("packet-count"),
    packetType: document.getElementById("packet-type"),
    packetDate: document.getElementById("packet-date"),
    packetTrust: document.getElementById("packet-trust"),
    packetTitle: document.getElementById("packet-title"),
    packetSummary: document.getElementById("packet-summary"),
    packetQuestion: document.getElementById("packet-question"),
    packetSources: document.getElementById("packet-sources"),
    claimList: document.getElementById("claim-list"),
    claimCount: document.getElementById("claim-count"),
    claimTitle: document.getElementById("claim-title"),
    claimStatus: document.getElementById("claim-status"),
    claimSummary: document.getElementById("claim-summary"),
    claimEvidence: document.getElementById("claim-evidence"),
    claimGap: document.getElementById("claim-gap"),
    claimCitations: document.getElementById("claim-citations"),
    claimSignals: document.getElementById("claim-signals"),
    draftState: document.getElementById("draft-state"),
    draftKicker: document.getElementById("draft-kicker"),
    draftTitle: document.getElementById("draft-title"),
    draftSummary: document.getElementById("draft-summary"),
    draftHook: document.getElementById("draft-hook"),
    draftCaption: document.getElementById("draft-caption"),
    draftScript: document.getElementById("draft-script"),
    draftCommentPrompt: document.getElementById("draft-comment-prompt"),
    draftSlides: document.getElementById("draft-slides"),
    draftCitations: document.getElementById("draft-citations"),
    draftShareSummary: document.getElementById("draft-share-summary"),
    draftNote: document.getElementById("draft-note"),
    aiStatusPill: document.getElementById("ai-status-pill"),
    aiProviderBadge: document.getElementById("ai-provider-badge"),
    aiConfigNote: document.getElementById("ai-config-note"),
    packagingPresets: document.getElementById("packaging-presets"),
    angleStatus: document.getElementById("angle-status"),
    generateAngleOptions: document.getElementById("generate-angle-options"),
    angleOptionsList: document.getElementById("angle-options-list"),
    textModelSelect: document.getElementById("text-model-select"),
    reviewModelSelect: document.getElementById("review-model-select"),
    imageModelSelect: document.getElementById("image-model-select"),
    videoModelSelect: document.getElementById("video-model-select"),
    generateIntakeBrief: document.getElementById("generate-intake-brief"),
    intakeBriefStatus: document.getElementById("intake-brief-status"),
    intakeBriefSummary: document.getElementById("intake-brief-summary"),
    intakeBriefThink: document.getElementById("intake-brief-think"),
    intakeBriefRecord: document.getElementById("intake-brief-record"),
    intakeBriefMissing: document.getElementById("intake-brief-missing"),
    generateClaimMap: document.getElementById("generate-claim-map"),
    claimMapStatus: document.getElementById("claim-map-status"),
    claimMapFraming: document.getElementById("claim-map-framing"),
    claimMapSupported: document.getElementById("claim-map-supported"),
    claimMapOpen: document.getElementById("claim-map-open"),
    claimMapRisks: document.getElementById("claim-map-risks"),
    generateText: document.getElementById("generate-text"),
    reviewDraft: document.getElementById("review-draft"),
    refineHook: document.getElementById("refine-hook"),
    refineCaption: document.getElementById("refine-caption"),
    refineReceipts: document.getElementById("refine-receipts"),
    refineUncertainty: document.getElementById("refine-uncertainty"),
    generateImage: document.getElementById("generate-image"),
    generateVideo: document.getElementById("generate-video"),
    resetGenerated: document.getElementById("reset-generated"),
    visualBriefText: document.getElementById("visual-brief-text"),
    imageStatus: document.getElementById("image-status"),
    generatedImageFrame: document.getElementById("generated-image-frame"),
    generatedImage: document.getElementById("generated-image"),
    downloadImage: document.getElementById("download-image"),
    videoBriefText: document.getElementById("video-brief-text"),
    videoStatus: document.getElementById("video-status"),
    videoJobStatus: document.getElementById("video-job-status"),
    generatedVideoFrame: document.getElementById("generated-video-frame"),
    generatedVideo: document.getElementById("generated-video"),
    generatedVideoDemo: document.getElementById("generated-video-demo"),
    refreshVideo: document.getElementById("refresh-video"),
    downloadVideo: document.getElementById("download-video"),
    safetyNotes: document.getElementById("safety-notes"),
    manipulationList: document.getElementById("manipulation-list"),
    amplificationNote: document.getElementById("amplification-note"),
    reviewChecklist: document.getElementById("review-checklist"),
    checklistProgress: document.getElementById("checklist-progress"),
    blockerList: document.getElementById("blocker-list"),
    reviewerNotes: document.getElementById("reviewer-notes"),
    gateStatusCard: document.getElementById("gate-status-card"),
    gateStatusTitle: document.getElementById("gate-status-title"),
    gateStatusText: document.getElementById("gate-status-text"),
    reviewFindingsStatus: document.getElementById("review-findings-status"),
    reviewVerdict: document.getElementById("review-verdict"),
    reviewSummary: document.getElementById("review-summary"),
    reviewStrengths: document.getElementById("review-strengths"),
    reviewRisks: document.getElementById("review-risks"),
    reviewFixes: document.getElementById("review-fixes"),
    historyList: document.getElementById("history-list"),
    exportTitle: document.getElementById("export-title"),
    exportSummary: document.getElementById("export-summary"),
    exportHandoffStatus: document.getElementById("export-handoff-status"),
    exportPreviewStatus: document.getElementById("export-preview-status"),
    exportGuidance: document.getElementById("export-guidance"),
    exportPackaging: document.getElementById("export-packaging"),
    exportConfidence: document.getElementById("export-confidence"),
    exportAngle: document.getElementById("export-angle"),
    exportModels: document.getElementById("export-models"),
    exportAssets: document.getElementById("export-assets"),
    exportPreviewTitle: document.getElementById("export-preview-title"),
    exportPreviewSummary: document.getElementById("export-preview-summary"),
    exportPreviewPrompt: document.getElementById("export-preview-prompt"),
    exportPreviewGuardrail: document.getElementById("export-preview-guardrail"),
    shareLink: document.getElementById("share-link"),
    approveReview: document.getElementById("approve-review"),
    requestRevision: document.getElementById("request-revision"),
    copyOutput: document.getElementById("copy-output"),
    downloadOutput: document.getElementById("download-output"),
    copyShareLink: document.getElementById("copy-share-link"),
    openSharePreview: document.getElementById("open-share-preview"),
    duplicateAudience: document.getElementById("duplicate-audience"),
    stepIntakeStatus: document.getElementById("step-intake-status"),
    stepVerifyStatus: document.getElementById("step-verify-status"),
    stepDraftStatus: document.getElementById("step-draft-status"),
    stepExportStatus: document.getElementById("step-export-status"),
    stageHost: document.getElementById("stage-host"),
    nextActionLabel: document.getElementById("next-action-label"),
    nextActionTitle: document.getElementById("next-action-title"),
    nextActionText: document.getElementById("next-action-text"),
    nextActionButton: document.getElementById("next-action-button"),
    appStatus: document.getElementById("app-status"),
    readonlyBanner: document.getElementById("readonly-banner"),
    feedbackToast: document.getElementById("feedback-toast")
  });
}

function getPacket(packetId = store.workspace?.activePacketId) {
  return store.packets.find((packet) => packet.id === packetId) || store.packets[0] || null;
}

function getWorkspace(packetId = getPacket()?.id) {
  const packet = getPacket(packetId);
  return packet && store.workspace ? store.workspace.workspaceStateByPacket?.[packet.id] || null : null;
}

function getAudience(packetId = getPacket()?.id) {
  const workspace = getWorkspace(packetId);
  return store.audiences.find((audience) => audience.id === workspace?.selectedAudienceId) || store.audiences[0] || null;
}

function getClaim(packetId = getPacket()?.id) {
  const packet = getPacket(packetId);
  const workspace = getWorkspace(packetId);
  return packet?.claims[workspace?.selectedClaimIndex || 0] || packet?.claims?.[0] || null;
}

function getDraft(packetId = getPacket()?.id) {
  const packet = getPacket(packetId);
  const workspace = getWorkspace(packetId);
  return packet?.drafts?.[workspace?.selectedFormat] || packet?.drafts?.carousel || null;
}

function getGeneratedBundle(packetId = getPacket()?.id, format = getWorkspace(packetId)?.selectedFormat) {
  const workspace = getWorkspace(packetId);
  return workspace?.generatedBundlesByFormat?.[format] || null;
}

function getBundle(packetId = getPacket()?.id) {
  const packet = getPacket(packetId);
  const workspace = getWorkspace(packetId);
  return getGeneratedBundle(packetId, workspace?.selectedFormat)
    || packet?.outputBundles?.[workspace?.selectedFormat]
    || packet?.outputBundles?.carousel
    || null;
}

function ensurePacketMediaState(packetId = getPacket()?.id) {
  if (!packetId) {
    return { imagesByFormat: {}, videosByFormat: {} };
  }

  if (!mediaState.byPacket[packetId]) {
    mediaState.byPacket[packetId] = {
      imagesByFormat: {},
      videosByFormat: {}
    };
  }

  return mediaState.byPacket[packetId];
}

function getImageAsset(packetId = getPacket()?.id, format = getWorkspace(packetId)?.selectedFormat) {
  return ensurePacketMediaState(packetId).imagesByFormat?.[format] || null;
}

function getVideoAsset(packetId = getPacket()?.id, format = getWorkspace(packetId)?.selectedFormat) {
  return ensurePacketMediaState(packetId).videosByFormat?.[format] || null;
}

function getAiSettings(packetId = getPacket()?.id) {
  const workspace = getWorkspace(packetId);
  const config = runtimeConfig || {};
  return {
    textModel: workspace?.aiSettings?.textModel || config.text?.selectedModel || "gpt-5",
    reviewModel: workspace?.aiSettings?.reviewModel || config.review?.selectedModel || "gpt-5-mini",
    imageModel: workspace?.aiSettings?.imageModel || config.image?.selectedModel || "gpt-image-1.5",
    videoModel: workspace?.aiSettings?.videoModel || config.video?.selectedModel || "sora-2"
  };
}

function getIntakeBrief(packetId = getPacket()?.id) {
  return getWorkspace(packetId)?.intakeBrief || null;
}

function getClaimMap(packetId = getPacket()?.id) {
  return getWorkspace(packetId)?.claimMap || null;
}

function getReviewFindings(packetId = getPacket()?.id) {
  return getWorkspace(packetId)?.reviewFindings || null;
}

function getGenerationRuns(packetId = getPacket()?.id) {
  return getWorkspace(packetId)?.generationRuns || [];
}

function getPackagingPreset(packetId = getPacket()?.id) {
  return getPackagingPresetKey(getWorkspace(packetId)?.packagingPreset, "fast_myth_check");
}

function getAngleOptions(packetId = getPacket()?.id) {
  return getWorkspace(packetId)?.angleOptions || [];
}

function getSelectedAngle(packetId = getPacket()?.id) {
  const workspace = getWorkspace(packetId);
  const options = getAngleOptions(packetId);
  const selectedIndex = Number.isInteger(workspace?.selectedAngleIndex)
    ? Math.max(0, Math.min(workspace.selectedAngleIndex, Math.max(options.length - 1, 0)))
    : 0;
  return options[selectedIndex] || null;
}

function getFallbackFactory() {
  return globalThis.PUENTES_STATIC_DATA?.createWorkspaceState || null;
}

function getSnapshotFromStore() {
  return {
    audiences: clone(store.audiences),
    packets: clone(store.packets),
    workspace: clone(store.workspace)
  };
}

function loadLocalSnapshot() {
  const staticData = globalThis.PUENTES_STATIC_DATA;
  if (!staticData) {
    return null;
  }

  try {
    const raw = globalThis.localStorage?.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return clone(staticData);
    }

    const parsed = JSON.parse(raw);
    if (parsed?.workspace && Array.isArray(parsed?.audiences) && Array.isArray(parsed?.packets)) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to read local demo snapshot", error);
  }

  return clone(staticData);
}

function saveLocalSnapshot() {
  if (!globalThis.localStorage || persistenceMode !== "local") {
    return;
  }

  globalThis.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getSnapshotFromStore()));
}

function loadMediaSnapshot() {
  if (!globalThis.localStorage) {
    return { byPacket: {} };
  }

  try {
    const raw = globalThis.localStorage.getItem(MEDIA_STORAGE_KEY);
    if (!raw) {
      return { byPacket: {} };
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { byPacket: {} };
  } catch (error) {
    console.warn("Failed to read local media snapshot", error);
    return { byPacket: {} };
  }
}

function hydrateMediaSnapshot(snapshot) {
  mediaState.byPacket = snapshot?.byPacket && typeof snapshot.byPacket === "object"
    ? snapshot.byPacket
    : {};
}

function saveMediaSnapshot() {
  if (!globalThis.localStorage) {
    return;
  }

  try {
    globalThis.localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(mediaState));
  } catch (error) {
    console.warn("Failed to persist media snapshot", error);
  }
}

function sanitizeLocalText(value, maxLength = 240) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeLocalNote(value, maxLength = 1200) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function getPackagingPresetKey(value, fallback = "fast_myth_check") {
  const candidate = sanitizeLocalText(value || fallback, 80);
  return Object.prototype.hasOwnProperty.call(PACKAGING_PRESETS, candidate) ? candidate : fallback;
}

function sanitizeList(items, maxItems = 6, maxLength = 240) {
  return Array.isArray(items)
    ? items.map((item) => sanitizeLocalText(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function normalizeLocalAiSettings(aiSettings = {}) {
  const config = runtimeConfig || {};
  return {
    textModel: sanitizeLocalText(aiSettings.textModel || config.text?.selectedModel || "gpt-5", 80),
    reviewModel: sanitizeLocalText(aiSettings.reviewModel || config.review?.selectedModel || "gpt-5-mini", 80),
    imageModel: sanitizeLocalText(aiSettings.imageModel || config.image?.selectedModel || "gpt-image-1.5", 80),
    videoModel: sanitizeLocalText(aiSettings.videoModel || config.video?.selectedModel || "sora-2", 80)
  };
}

function normalizeLocalRun(run = {}, index = 0) {
  return {
    id: sanitizeLocalText(run.id || `run-${index}`, 80),
    type: sanitizeLocalText(run.type, 60),
    status: sanitizeLocalText(run.status || "ready", 40),
    model: sanitizeLocalText(run.model, 80),
    target: sanitizeLocalText(run.target, 120),
    generatedAt: validIsoTimestamp(run.generatedAt || new Date().toISOString())
  };
}

function normalizeLocalRuns(runs = []) {
  return Array.isArray(runs)
    ? runs.map(normalizeLocalRun).filter((run) => run.type).slice(0, 24)
    : [];
}

function normalizeLocalAngleOptions(angleOptions = []) {
  return Array.isArray(angleOptions)
    ? angleOptions
      .map((angle) => ({
        label: sanitizeLocalText(angle?.label, 60),
        hook: sanitizeLocalNote(angle?.hook, 220),
        audienceFit: sanitizeLocalNote(angle?.audienceFit, 220),
        riskNote: sanitizeLocalNote(angle?.riskNote, 220),
        avoidWhen: sanitizeLocalNote(angle?.avoidWhen, 220)
      }))
      .filter((angle) => angle.label)
      .slice(0, 3)
    : [];
}

function validIsoTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeGeneratedBundlePayload(payload, context) {
  const output = payload?.output || {};

  return {
    label: `AI ${context.baseBundle.label}`,
    title: sanitizeLocalText(output.title, 180),
    hook: sanitizeLocalNote(output.hook, 320),
    caption: sanitizeLocalNote(output.caption, 1200),
    script: sanitizeLocalNote(output.script, 1600),
    slides: sanitizeList(output.slides, 6, 220),
    commentPrompt: sanitizeLocalNote(output.commentPrompt, 320),
    citations: sanitizeList(output.citations, 6, 180),
    shareSummary: sanitizeLocalText(
      `${context.packet.shortLabel}: ${output.hook || output.caption || context.baseBundle.shareSummary}`,
      240
    ),
    note: sanitizeLocalNote((output.safetyNotes || []).join(" "), 600),
    visualBrief: sanitizeLocalNote(output.visualBrief, 700),
    videoBrief: sanitizeLocalNote(output.videoBrief, 700),
    safetyNotes: sanitizeList(output.safetyNotes, 5, 220),
    model: sanitizeLocalText(payload?.model, 80),
    responseId: sanitizeLocalText(payload?.id, 120),
    generatedAt: new Date().toISOString()
  };
}

function buildFallbackSafetyNotes(packet = getPacket(), claim = getClaim(), audience = getAudience()) {
  return [
    ...sanitizeList(claim?.signals, 2, 220),
    sanitizeLocalText(claim?.gap || "", 220),
    sanitizeLocalText(packet?.amplification || "", 220),
    sanitizeLocalText(audience?.draftRule || "", 220)
  ].filter(Boolean).slice(0, 5);
}

function buildVisualPrompt(bundle = getBundle(), packet = getPacket(), audience = getAudience(), claim = getClaim()) {
  if (bundle?.visualBrief) {
    return bundle.visualBrief;
  }

  return [
    `Create a bold civic explainer cover image for ${packet.label}.`,
    `Audience: ${audience.label}.`,
    `Hook: ${bundle.hook}.`,
    `Claim focus: ${claim.title}.`,
    "Use editorial composition, confident typography space, and a trustworthy, youth-native tone.",
    "No fearmongering, no partisan logos, no sensational disaster imagery."
  ].join(" ");
}

function buildVideoPrompt(bundle = getBundle(), packet = getPacket(), audience = getAudience(), claim = getClaim()) {
  if (bundle?.videoBrief) {
    return bundle.videoBrief;
  }

  return [
    `Create an 8-second vertical-adjacent civic explainer clip for ${packet.label}.`,
    `Audience: ${audience.label}.`,
    `Open with this hook: ${bundle.hook}.`,
    `Keep the focus on: ${claim.title}.`,
    "Style it like a polished social explainer with motion graphics energy, clear pacing, and no panic framing."
  ].join(" ");
}

function shortSentence(value, maxLength = 150) {
  return sanitizeLocalNote(value, maxLength).replace(/\s+/g, " ").trim();
}

function trimCaption(value, maxLength = 220) {
  return sanitizeLocalNote(value, maxLength).replace(/\s{2,}/g, " ").trim();
}

function buildDemoGeneratedBundle(context, presetKey = "fresh") {
  const { packet, audience, claim } = context;
  const currentBundle = getBundle();
  const baseBundle = context.seedBundle;
  const baseSafetyNotes = buildFallbackSafetyNotes(packet, claim, audience);
  const baseTitle = shortSentence(currentBundle?.title || baseBundle.title, 180);
  const baseHook = shortSentence(currentBundle?.hook || baseBundle.hook, 220);
  const baseCaption = trimCaption(currentBundle?.caption || baseBundle.caption, 420);
  const unresolvedLine = shortSentence(claim.gap || "Some implementation details still need to be checked.", 180);
  const citations = (currentBundle?.citations?.length ? currentBundle.citations : baseBundle.citations).slice(0, 4);

  const bundle = {
    label: `AI ${baseBundle.label}`,
    title: baseTitle,
    hook: baseHook,
    caption: baseCaption,
    script: sanitizeLocalNote(currentBundle?.script || baseBundle.script, 1600),
    slides: sanitizeList(currentBundle?.slides || baseBundle.slides, 6, 220),
    commentPrompt: shortSentence(currentBundle?.commentPrompt || baseBundle.commentPrompt, 220),
    citations,
    shareSummary: shortSentence(currentBundle?.shareSummary || baseBundle.shareSummary, 220),
    note: sanitizeLocalNote(currentBundle?.note || baseBundle.note, 600),
    visualBrief: buildVisualPrompt(currentBundle || baseBundle, packet, audience, claim),
    videoBrief: buildVideoPrompt(currentBundle || baseBundle, packet, audience, claim),
    safetyNotes: baseSafetyNotes,
    model: "puentes-demo",
    responseId: `demo-${Date.now()}`,
    generatedAt: new Date().toISOString()
  };

  if (presetKey === "hook") {
    bundle.hook = shortSentence(`Quick reset: ${claim.title.replace(/\.$/, "")}, but the record is narrower than the feed makes it sound.`, 220);
    bundle.caption = trimCaption(`${bundle.hook} ${baseCaption}`, 320);
  } else if (presetKey === "caption") {
    bundle.caption = trimCaption(`${bundle.hook} ${shortSentence(claim.summary, 120)} Sources stay attached in the handoff.`, 220);
  } else if (presetKey === "receipts") {
    bundle.caption = trimCaption(`${baseCaption} Receipts: ${citations.slice(0, 2).join(" + ")}.`, 320);
    bundle.note = sanitizeLocalNote(`${bundle.note} Lead with what is documented and keep the receipts visible in the post body.`, 600);
  } else if (presetKey === "uncertainty") {
    bundle.caption = trimCaption(`${baseCaption} What is still open: ${unresolvedLine}`, 340);
    bundle.shareSummary = shortSentence(`${packet.shortLabel}: what changed, what stayed, and what still needs watching.`, 200);
    bundle.safetyNotes = sanitizeList([...baseSafetyNotes, unresolvedLine], 5, 220);
  } else {
    bundle.title = shortSentence(`${packet.label}: what changed, what stayed, and what still needs context`, 180);
    bundle.hook = shortSentence(`Quick reset: ${claim.title.replace(/\.$/, "")} is not the whole story. Here is the cleaner version.`, 220);
    bundle.caption = trimCaption(`${bundle.hook} ${shortSentence(claim.summary, 150)} What changed, what stayed, and what still needs watching are all in the handoff.`, 340);
    bundle.script = sanitizeLocalNote(`${bundle.hook}\n\n${shortSentence(claim.evidence, 260)}\n\nWhat is still open: ${unresolvedLine}\n\nSources stay attached so people can check the record themselves.`, 1600);
    bundle.slides = sanitizeList([
      `What people are saying: ${claim.title}`,
      `What the packet supports: ${shortSentence(claim.evidence, 120)}`,
      `What is still open: ${unresolvedLine}`,
      "Why this can travel: the receipts stay attached."
    ], 6, 220);
    bundle.commentPrompt = shortSentence(`What part of this issue gets distorted fastest once it hits the feed?`, 180);
    bundle.shareSummary = shortSentence(`${packet.shortLabel}: a source-linked explainer for ${audience.label.toLowerCase()} mode.`, 180);
  }

  return bundle;
}

function buildDemoImageAsset(context) {
  const bundle = getBundle();
  const title = escapeHtml(shortSentence(bundle.title, 90));
  const hook = escapeHtml(shortSentence(bundle.hook, 120));
  const label = escapeHtml(`${context.packet.shortLabel} / ${context.audience.label}`);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#102337"/>
      <stop offset="55%" stop-color="#20445f"/>
      <stop offset="100%" stop-color="#ff6b3d"/>
    </linearGradient>
  </defs>
  <rect width="1536" height="1024" rx="54" fill="url(#bg)"/>
  <circle cx="1280" cy="180" r="220" fill="rgba(255,255,255,0.08)"/>
  <circle cx="260" cy="840" r="260" fill="rgba(255,255,255,0.06)"/>
  <rect x="104" y="96" width="220" height="52" rx="26" fill="#fff4ea" opacity="0.95"/>
  <text x="140" y="130" fill="#cb4920" font-family="Arial, sans-serif" font-size="24" font-weight="700">Puentes visual</text>
  <text x="108" y="290" fill="#fff8f2" font-family="Georgia, serif" font-size="90" font-weight="700">${title}</text>
  <text x="108" y="410" fill="#ffe7db" font-family="Arial, sans-serif" font-size="34">${hook}</text>
  <rect x="108" y="760" width="340" height="96" rx="28" fill="#fff4ea"/>
  <text x="148" y="815" fill="#102337" font-family="Arial, sans-serif" font-size="26" font-weight="700">${label}</text>
  <text x="148" y="848" fill="#475869" font-family="Arial, sans-serif" font-size="22">Source-linked social cover</text>
</svg>`;

  return {
    prompt: buildVisualPrompt(),
    status: "ready",
    generatedAt: new Date().toISOString(),
    model: "puentes-demo",
    dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    revisedPrompt: "Demo visual generated locally from the current packet and draft."
  };
}

function buildDemoVideoAsset(context) {
  const bundle = getBundle();
  return {
    prompt: buildVideoPrompt(),
    status: "processing",
    id: `demo-video-${Date.now()}`,
    model: "puentes-demo",
    createdAt: new Date().toISOString(),
    demo: true,
    demoTitle: shortSentence(bundle.hook, 120),
    demoSummary: shortSentence(`8-second explainer concept for ${context.packet.shortLabel}. Text first, motion second.`, 180)
  };
}

function useDemoTextFallback(error) {
  return /request failed|failed to fetch|not configured|not found|api unavailable/i.test(String(error?.message || ""));
}

function useDemoMediaFallback(error) {
  return /request failed|failed to fetch|not configured|not found|api unavailable/i.test(String(error?.message || ""));
}

function getSmokeMode() {
  return new URLSearchParams(window.location.search).get("smoke");
}

function demoSmokeEnabled() {
  return getSmokeMode() === "demo";
}

function prepareSmokeModeState() {
  if (!demoSmokeEnabled() || !globalThis.localStorage) {
    return;
  }

  try {
    globalThis.localStorage.removeItem(LOCAL_STORAGE_KEY);
    globalThis.localStorage.removeItem(MEDIA_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to reset smoke mode state", error);
  }
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForCondition(check, timeout = 5000, interval = 120) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    if (check()) {
      return true;
    }
    await sleep(interval);
  }

  return false;
}

function readableVideoStatus(status) {
  const value = String(status || "").toLowerCase();

  if (["completed", "succeeded", "ready"].includes(value)) {
    return "ready";
  }

  if (["failed", "cancelled", "error"].includes(value)) {
    return "error";
  }

  if (["queued", "submitted"].includes(value)) {
    return "queued";
  }

  if (value) {
    return "processing";
  }

  return "empty";
}

function videoIsReady(videoAsset = getVideoAsset()) {
  return readableVideoStatus(videoAsset?.status) === "ready";
}

function appendLocalHistory(packetId, action, detail) {
  const workspace = getWorkspace(packetId);
  if (!workspace || !action) {
    return;
  }

  workspace.history = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      action: sanitizeLocalText(action, 100),
      detail: sanitizeLocalText(detail, 240)
    },
    ...(workspace.history || [])
  ].slice(0, 12);
}

function isValidAudienceId(audienceId) {
  return store.audiences.some((audience) => audience.id === audienceId);
}

function getAudienceDefaultFormat(audienceId) {
  return store.audiences.find((audience) => audience.id === audienceId)?.defaultFormat || "creator";
}

function normalizeLocalWorkspace(packetId, candidate = {}) {
  const packet = getPacket(packetId);
  const factory = getFallbackFactory();
  const defaults = typeof factory === "function"
    ? factory(packetId)
    : clone(store.workspace.workspaceStateByPacket?.[packetId] || {});
  const audienceId = isValidAudienceId(candidate.selectedAudienceId) ? candidate.selectedAudienceId : defaults.selectedAudienceId;
  const requestedFormat = typeof candidate.selectedFormat === "string" ? candidate.selectedFormat : defaults.selectedFormat;
  const selectedFormat = packet?.outputBundles?.[requestedFormat]
    ? requestedFormat
    : getAudienceDefaultFormat(audienceId);
  const nextClaimIndex = Number(candidate.selectedClaimIndex);
  const angleOptions = normalizeLocalAngleOptions(candidate.angleOptions ?? defaults.angleOptions ?? []);
  const nextSelectedAngleIndex = Number(candidate.selectedAngleIndex);
  const maxAngleIndex = Math.max(angleOptions.length - 1, 0);

  return {
    ...defaults,
    ...candidate,
    selectedAudienceId: audienceId,
    selectedFormat,
    selectedClaimIndex: Number.isInteger(nextClaimIndex)
      ? Math.max(0, Math.min(nextClaimIndex, (packet?.claims.length || 1) - 1))
      : defaults.selectedClaimIndex,
    reviewStatus: ["pending", "approved", "revision"].includes(candidate.reviewStatus)
      ? candidate.reviewStatus
      : defaults.reviewStatus,
    checklist: Array.isArray(candidate.checklist) ? clone(candidate.checklist) : clone(defaults.checklist),
    reviewerNotes: sanitizeLocalNote(candidate.reviewerNotes ?? defaults.reviewerNotes ?? ""),
    history: Array.isArray(candidate.history) ? clone(candidate.history) : clone(defaults.history || []),
    exportedFormats: Array.isArray(candidate.exportedFormats)
      ? [...new Set(candidate.exportedFormats.filter((format) => packet?.outputBundles?.[format]))]
      : clone(defaults.exportedFormats || []),
    shareReady: Boolean(candidate.shareReady),
    shareUrl: sanitizeLocalText(candidate.shareUrl ?? defaults.shareUrl ?? "", 320),
    packagingPreset: getPackagingPresetKey(candidate.packagingPreset ?? defaults.packagingPreset ?? "fast_myth_check"),
    aiSettings: normalizeLocalAiSettings(candidate.aiSettings || defaults.aiSettings || {}),
    intakeBrief: candidate.intakeBrief && typeof candidate.intakeBrief === "object"
      ? clone(candidate.intakeBrief)
      : clone(defaults.intakeBrief || null),
    claimMap: candidate.claimMap && typeof candidate.claimMap === "object"
      ? clone(candidate.claimMap)
      : clone(defaults.claimMap || null),
    angleOptions,
    selectedAngleIndex: Number.isInteger(nextSelectedAngleIndex)
      ? Math.max(0, Math.min(nextSelectedAngleIndex, maxAngleIndex))
      : Math.max(0, Math.min(defaults.selectedAngleIndex || 0, maxAngleIndex)),
    reviewFindings: candidate.reviewFindings && typeof candidate.reviewFindings === "object"
      ? clone(candidate.reviewFindings)
      : clone(defaults.reviewFindings || null),
    generationRuns: normalizeLocalRuns(candidate.generationRuns ?? defaults.generationRuns ?? [])
  };
}

function buildDemoIntakeBrief(context) {
  return {
    summary: `The core ask is to explain ${context.claim.title.replace(/\.$/, "")} without repeating the loudest framing.`,
    peopleThink: shortSentence(context.storeQuestion || context.packet.question, 260),
    recordSays: shortSentence(`${context.claim.summary} ${context.claim.evidence}`, 280),
    missing: shortSentence(context.claim.gap, 260),
    recommendedPacketId: context.packet.id,
    recommendedClaimIndex: context.workspace.selectedClaimIndex,
    model: "puentes-demo",
    generatedAt: new Date().toISOString()
  };
}

function buildDemoClaimMap(context) {
  return {
    framing: shortSentence(`This claim should be framed as ${context.claim.status} rather than absolute. Start from what the packet can defend, then show the open gap.`, 300),
    supportedPoints: sanitizeList([
      context.claim.summary,
      context.claim.evidence,
      `${context.packet.shortLabel} packet sources stay attached in the handoff.`
    ], 4, 220),
    openQuestions: sanitizeList([
      context.claim.gap,
      context.packet.amplification
    ], 4, 220),
    languageRisks: sanitizeList([
      ...context.packet.manipulation.slice(0, 2),
      ...context.claim.signals.slice(0, 2)
    ], 4, 220),
    model: "puentes-demo",
    generatedAt: new Date().toISOString()
  };
}

function buildDemoAngleOptions(context) {
  return [
    {
      label: "Myth reset",
      hook: shortSentence(`Quick reset: ${context.claim.title.replace(/\.$/, "")} is not the whole record.`, 160),
      audienceFit: `Best when the audience already saw the misleading post and needs a fast correction for ${context.audience.label.toLowerCase()} mode.`,
      riskNote: "Do not overstate certainty. Keep one unresolved point visible.",
      avoidWhen: "Avoid when the story needs a full sequence of policy changes, not just a reset."
    },
    {
      label: "What changed",
      hook: shortSentence(`What actually changed in ${context.packet.shortLabel.toLowerCase()} and what did not?`, 160),
      audienceFit: "Best for carousels or explainers where comparison matters more than clapback energy.",
      riskNote: "Make the before/after concrete so the post does not collapse into vibes.",
      avoidWhen: "Avoid when the audience needs a short myth check more than a fuller comparison."
    },
    {
      label: "What people miss",
      hook: shortSentence(`The part most people are skipping is the unresolved gap in the record.`, 160),
      audienceFit: "Best when the issue is being flattened into certainty and you need to reintroduce nuance without losing clarity.",
      riskNote: "Do not sound evasive. Pair the uncertainty with the strongest documented point.",
      avoidWhen: "Avoid when the packet is too weak to support a strong documented spine first."
    }
  ];
}

function buildDemoReviewFindings(context) {
  const bundle = getBundle();
  return {
    verdict: "needs-review",
    summary: shortSentence(`The draft is usable, but a human should confirm the citation visibility and unresolved gap before export.`, 260),
    strengths: sanitizeList([
      `Keeps the packet centered around ${context.claim.title}`,
      "Maintains a source-linked tone without panic framing"
    ], 4, 220),
    risks: sanitizeList([
      context.claim.gap,
      context.packet.amplification
    ], 5, 220),
    fixes: sanitizeList([
      "Bring one citation line closer to the opening hook.",
      "Make the unresolved point more explicit before approval."
    ], 5, 220),
    model: "puentes-demo",
    generatedAt: new Date().toISOString()
  };
}

function saveStatusText(timestamp) {
  const date = new Date(timestamp);
  const prefix = persistenceMode === "local" ? "Local demo" : "Saved";
  if (Number.isNaN(date.getTime())) {
    return prefix;
  }
  return `${prefix} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function formatSavedTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Saved locally";
  }
  return `Saved ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function createListMarkup(items, emptyText = "Nothing here yet.") {
  if (!items || !items.length) {
    return `<li class="empty-state">${escapeHtml(emptyText)}</li>`;
  }
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function historyMarkup(entry) {
  const meta = new Date(entry.timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  return `
    <li>
      <strong>${escapeHtml(entry.action)}</strong>
      <span>${escapeHtml(entry.detail || "")}</span>
      <span class="history-meta">${escapeHtml(meta)}</span>
    </li>
  `;
}

function runMarkup(run) {
  const timestamp = new Date(run.generatedAt);
  const meta = `${run.model || "demo"} | ${timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
  return `
    <li>
      <strong>${escapeHtml(run.type.replace(/_/g, " "))}</strong>
      <span>${escapeHtml(run.target || run.status)}</span>
      <span class="history-meta">${escapeHtml(meta)}</span>
    </li>
  `;
}

function audienceTabMarkup(audience, packetId) {
  const active = audience.id === getWorkspace(packetId)?.selectedAudienceId;
  return `
    <button
      class="audience-tab${active ? " is-active" : ""}"
      type="button"
      data-audience-id="${escapeHtml(audience.id)}"
      aria-selected="${active}"
      ${readonlyMode ? "disabled" : ""}
    >
      <strong>${escapeHtml(audience.label)}</strong>
      <span>${escapeHtml(audience.kicker)}</span>
    </button>
  `;
}

function packetTabMarkup(packet) {
  const active = packet.id === store.workspace?.activePacketId;
  return `
    <button
      class="packet-tab${active ? " is-active" : ""}"
      type="button"
      data-packet-id="${escapeHtml(packet.id)}"
      aria-selected="${active}"
      ${readonlyMode ? "disabled" : ""}
    >
      <strong>${escapeHtml(packet.label)}</strong>
      <span>${escapeHtml(packet.summary)}</span>
    </button>
  `;
}

function claimStatusText(status) {
  if (status === "supported") {
    return "Supported";
  }
  if (status === "mixed") {
    return "Contested";
  }
  return "Unclear";
}

function claimTabMarkup(claim, index, packetId) {
  const active = index === getWorkspace(packetId)?.selectedClaimIndex;
  return `
    <button
      class="claim-tab${active ? " is-active" : ""}"
      type="button"
      data-claim-index="${index}"
      aria-selected="${active}"
      ${readonlyMode ? "disabled" : ""}
    >
      <strong>${escapeHtml(claim.title)}</strong>
      <span>${escapeHtml(`${claimStatusText(claim.status)}: ${claim.summary}`)}</span>
    </button>
  `;
}

function checklistItemMarkup(item) {
  return `
    <label class="check-item${item.done ? " is-complete" : ""}">
      <input type="checkbox" data-check-id="${escapeHtml(item.id)}" ${item.done ? "checked" : ""} ${readonlyMode ? "disabled" : ""}>
      <span>${escapeHtml(item.label)}</span>
    </label>
  `;
}

function allChecklistDone(workspace = getWorkspace()) {
  return Boolean(workspace?.checklist?.length) && workspace.checklist.every((item) => item.done);
}

function getBlockers(workspace = getWorkspace()) {
  const blockers = [];

  if (!workspace) {
    return ["Workspace failed to load."];
  }

  workspace.checklist.forEach((item) => {
    if (!item.done) {
      blockers.push(item.label);
    }
  });

  if (workspace.reviewStatus === "revision") {
    blockers.push("This packet is currently marked for revision.");
  }

  return blockers;
}

function getShareUrl(packetId = getPacket()?.id) {
  const packet = getPacket(packetId);
  const workspace = getWorkspace(packetId);

  if (!packet || !workspace) {
    return "";
  }

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("share", packet.id);
  url.searchParams.set("format", workspace.selectedFormat);
  url.searchParams.set("audience", workspace.selectedAudienceId);
  return url.toString();
}

function buildExportText() {
  const packet = getPacket();
  const audience = getAudience();
  const bundle = getBundle();
  const workspace = getWorkspace();
  const claim = getClaim();
  const imageAsset = getImageAsset();
  const videoAsset = getVideoAsset();
  const intakeBrief = getIntakeBrief();
  const claimMap = getClaimMap();
  const reviewFindings = getReviewFindings();
  const selectedAngle = getSelectedAngle();
  const angleOptions = getAngleOptions();
  const generationRuns = getGenerationRuns();
  const packagingPreset = PACKAGING_PRESETS[getPackagingPreset()]?.label || "Fast myth check";
  const hookVariants = [
    bundle.hook,
    selectedAngle?.hook || "",
    `What changed, what stayed, and what is still unresolved in ${packet.shortLabel}.`
  ].filter(Boolean);
  const whatNotToSay = reviewFindings?.risks?.length
    ? reviewFindings.risks
    : buildFallbackSafetyNotes(packet, claim, audience);

  return [
    "Puentes creator handoff",
    "",
    `Packet: ${packet.label}`,
    `Audience: ${audience.label}`,
    `Format: ${bundle.label}`,
    `Packaging mode: ${packagingPreset}`,
    `Confidence: ${claimStatusText(claim.status)}`,
    `Review status: ${workspace.reviewStatus}`,
    `Draft model: ${getAiSettings().textModel}`,
    `Review model: ${getAiSettings().reviewModel}`,
    "",
    "Title",
    bundle.title,
    "",
    "Primary caption",
    bundle.caption,
    "",
    "Hook variants",
    ...hookVariants.map((hook, index) => `${index + 1}. ${hook}`),
    "",
    "Thumbnail line",
    selectedAngle?.label ? `${selectedAngle.label}: ${selectedAngle.hook}` : bundle.hook,
    "",
    "Angle stack",
    ...(angleOptions.length
      ? angleOptions.map((angle, index) => `${index + 1}. ${angle.label}: ${angle.hook}`)
      : ["No angle stack generated."]),
    "",
    "Pinned comment",
    `${bundle.commentPrompt} Sources are attached in the handoff.`,
    "",
    "Script / talking path",
    bundle.script,
    "",
    "Slides / beats",
    ...bundle.slides.map((slide, index) => `${index + 1}. ${slide}`),
    "",
    "Visual brief",
    bundle.visualBrief || buildVisualPrompt(bundle, packet, audience, claim),
    "",
    "Video brief",
    bundle.videoBrief || buildVideoPrompt(bundle, packet, audience, claim),
    "",
    "Current claim check",
    claim.title,
    claim.summary,
    "",
    "Intake brief",
    intakeBrief?.summary || "No intake brief generated.",
    intakeBrief?.peopleThink ? `What people think: ${intakeBrief.peopleThink}` : "",
    intakeBrief?.recordSays ? `What the record says: ${intakeBrief.recordSays}` : "",
    intakeBrief?.missing ? `Still missing: ${intakeBrief.missing}` : "",
    "",
    "Claim map",
    claimMap?.framing || "No claim map generated.",
    ...(claimMap?.supportedPoints || []).map((item) => `Supported: ${item}`),
    ...(claimMap?.openQuestions || []).map((item) => `Open: ${item}`),
    ...(claimMap?.languageRisks || []).map((item) => `Risk: ${item}`),
    "",
    "Citations",
    ...bundle.citations.map((citation) => `- ${citation}`),
    "",
    "Reviewer notes",
    workspace.reviewerNotes || "No reviewer note added.",
    "",
    "Review copilot",
    reviewFindings?.summary || "No review findings generated.",
    ...(reviewFindings?.strengths || []).map((item) => `Strength: ${item}`),
    ...(reviewFindings?.risks || []).map((item) => `Risk: ${item}`),
    ...(reviewFindings?.fixes || []).map((item) => `Fix: ${item}`),
    "",
    "What not to say",
    ...whatNotToSay.map((item) => `- ${item}`),
    "",
    "Share summary",
    bundle.shareSummary,
    "",
    "Generated media",
    imageAsset?.dataUrl ? "Cover visual ready" : "No generated visual saved",
    videoAsset?.id ? `Video status: ${readableVideoStatus(videoAsset.status)}` : "No generated video job",
    "",
    "Run log",
    ...(generationRuns.length
      ? generationRuns.map((run) => `- ${run.type} | ${run.model} | ${run.target} | ${run.status}`)
      : ["- No AI runs recorded yet."])
  ].filter(Boolean).join("\n");
}

function setAppStatus(message = "", state = "loading", autoHide = false) {
  if (!message) {
    elements.appStatus.hidden = true;
    elements.appStatus.textContent = "";
    delete elements.appStatus.dataset.state;
    return;
  }

  elements.appStatus.hidden = false;
  elements.appStatus.dataset.state = state;
  elements.appStatus.textContent = message;

  if (autoHide) {
    window.setTimeout(() => {
      if (elements.appStatus.textContent === message) {
        setAppStatus();
      }
    }, 2200);
  }
}

function flashFeedback(message, state = "success") {
  window.clearTimeout(feedbackTimer);
  elements.feedbackToast.hidden = false;
  elements.feedbackToast.dataset.state = state;
  elements.feedbackToast.textContent = message;

  feedbackTimer = window.setTimeout(() => {
    elements.feedbackToast.hidden = true;
  }, 2600);
}

function setButtonBusy(button, busyLabel) {
  if (!button) {
    return;
  }

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent.trim();
  }

  button.classList.remove("is-done");
  button.classList.add("is-busy");
  button.textContent = busyLabel;
}

function clearButtonBusy(button) {
  if (!button) {
    return;
  }

  button.classList.remove("is-busy");
  if (button.dataset.defaultLabel) {
    button.textContent = button.dataset.defaultLabel;
  }
}

function pulseButtonDone(button, doneLabel = "Done") {
  if (!button) {
    return;
  }

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent.trim();
  }

  button.classList.remove("is-busy");
  button.classList.add("is-done");
  button.textContent = doneLabel;

  window.setTimeout(() => {
    button.classList.remove("is-done");
    if (button.dataset.defaultLabel) {
      button.textContent = button.dataset.defaultLabel;
    }
  }, 1100);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function setPillState(element, text, stateClass = "") {
  element.textContent = text;
  element.classList.remove("is-busy", "is-ready", "is-error");
  if (stateClass) {
    element.classList.add(stateClass);
  }
}

function renderAiStudio() {
  const packet = getPacket();
  const audience = getAudience();
  const claim = getClaim();
  const bundle = getBundle();
  const generatedBundle = getGeneratedBundle();
  const imageAsset = getImageAsset();
  const videoAsset = getVideoAsset();
  const aiSettings = getAiSettings();
  const safetyNotes = bundle?.safetyNotes?.length ? bundle.safetyNotes : buildFallbackSafetyNotes(packet, claim, audience);
  const visualPrompt = buildVisualPrompt(bundle, packet, audience, claim);
  const videoPrompt = buildVideoPrompt(bundle, packet, audience, claim);
  const videoState = readableVideoStatus(videoAsset?.status);
  const videoUnlocked = Boolean(generatedBundle || videoAsset?.id);

  elements.visualBriefText.textContent = visualPrompt;
  elements.videoBriefText.textContent = videoUnlocked
    ? videoPrompt
    : "Generate a fresh draft first. The motion pass is slower and works best once the text handoff already feels right.";
  elements.safetyNotes.innerHTML = createListMarkup(
    safetyNotes,
    "Generate a fresh AI draft to get packet-specific safety notes."
  );

  if (imageAsset?.dataUrl) {
    elements.generatedImage.hidden = false;
    if (elements.generatedImage.getAttribute("src") !== imageAsset.dataUrl) {
      elements.generatedImage.src = imageAsset.dataUrl;
    }
    elements.generatedImageFrame.dataset.state = imageAsset.status === "error" ? "error" : "ready";
  } else {
    elements.generatedImage.hidden = true;
    elements.generatedImage.removeAttribute("src");
    elements.generatedImageFrame.dataset.state = pendingState.image ? "loading" : imageAsset?.status || "empty";
  }

  if (videoIsReady(videoAsset) && videoAsset?.download?.video) {
    elements.generatedVideo.hidden = false;
    elements.generatedVideoDemo.hidden = true;
    if (elements.generatedVideo.getAttribute("src") !== videoAsset.download.video) {
      elements.generatedVideo.src = videoAsset.download.video;
    }
    elements.generatedVideoFrame.dataset.state = "ready";
  } else if (videoIsReady(videoAsset) && videoAsset?.demo) {
    elements.generatedVideo.hidden = true;
    elements.generatedVideo.removeAttribute("src");
    elements.generatedVideoDemo.hidden = false;
    elements.generatedVideoDemo.innerHTML = `
      <strong>${escapeHtml(videoAsset.demoTitle || "Demo video concept")}</strong>
      <p>${escapeHtml(videoAsset.demoSummary || "Motion concept ready in demo mode.")}</p>
    `;
    elements.generatedVideoFrame.dataset.state = "ready";
  } else {
    elements.generatedVideo.hidden = true;
    elements.generatedVideo.removeAttribute("src");
    elements.generatedVideoDemo.hidden = true;
    elements.generatedVideoDemo.textContent = "";
    elements.generatedVideoFrame.dataset.state = pendingState.video
      ? "loading"
      : videoState === "error"
        ? "error"
        : videoAsset?.id
          ? "loading"
          : "empty";
  }

  if (pendingState.text || pendingState.image || pendingState.video) {
    setPillState(elements.aiStatusPill, "Generating...", "is-busy");
  } else if (generatedBundle) {
    setPillState(elements.aiStatusPill, "Draft ready to tune", "is-ready");
  } else if (imageAsset?.dataUrl || videoAsset?.id) {
    setPillState(elements.aiStatusPill, "Extras attached", "is-ready");
  } else {
    setPillState(elements.aiStatusPill, "Ready to generate");
  }

  if (pendingState.image) {
    setPillState(elements.imageStatus, "Generating visual", "is-busy");
  } else if (imageAsset?.dataUrl) {
    setPillState(elements.imageStatus, "Visual ready", "is-ready");
  } else if (imageAsset?.status === "error") {
    setPillState(elements.imageStatus, "Visual failed", "is-error");
  } else {
    setPillState(elements.imageStatus, "No visual yet");
  }

  if (pendingState.video) {
    setPillState(elements.videoStatus, "Starting video", "is-busy");
  } else if (videoState === "ready") {
    setPillState(elements.videoStatus, "Video ready", "is-ready");
  } else if (videoState === "error") {
    setPillState(elements.videoStatus, "Video failed", "is-error");
  } else if (videoAsset?.id) {
    setPillState(elements.videoStatus, "Video processing", "is-busy");
  } else {
    setPillState(elements.videoStatus, "No video yet");
  }

  setPillState(elements.aiProviderBadge, runtimeConfig?.text?.provider?.toUpperCase?.() || "OPENAI");
  elements.aiConfigNote.textContent = runtimeConfig?.apiKeysConfigured?.openai
    ? "Keys stay server-side. The browser only chooses between allowed model IDs."
    : "No API key detected. Demo fallbacks will keep the workflow usable locally.";
  elements.visualBriefText.textContent = `${visualPrompt} Model: ${aiSettings.imageModel}.`;
  elements.videoBriefText.textContent = videoUnlocked
    ? `${videoPrompt} Model: ${aiSettings.videoModel}.`
    : "Generate a fresh draft first. The motion pass is slower and works best once the text handoff already feels right.";

  elements.videoJobStatus.textContent = videoAsset?.id
    ? videoAsset.demo
      ? videoState === "ready"
        ? "Demo video concept is ready for review."
        : "Demo video concept is rendering locally."
      : `Job ${videoAsset.id} is ${videoState === "processing" ? "still rendering" : videoState}.`
    : videoUnlocked
      ? "No video job started."
      : "Generate a fresh draft first. Video stays optional and slower.";

  if (videoAsset?.id && !videoAsset.demo && (videoState === "processing" || videoState === "queued")) {
    const videoKey = `${packet.id}:${getWorkspace(packet.id)?.selectedFormat}`;
    if (!videoPollTimers.has(videoKey)) {
      scheduleVideoPoll(packet.id, getWorkspace(packet.id)?.selectedFormat, 5000);
    }
  }

  elements.generateText.disabled = readonlyMode || pendingState.text;
  elements.reviewDraft.disabled = readonlyMode || pendingState.text;
  elements.refineHook.disabled = readonlyMode || pendingState.text;
  elements.refineCaption.disabled = readonlyMode || pendingState.text;
  elements.refineReceipts.disabled = readonlyMode || pendingState.text;
  elements.refineUncertainty.disabled = readonlyMode || pendingState.text;
  elements.generateImage.disabled = readonlyMode || pendingState.text || pendingState.image;
  elements.generateVideo.disabled = readonlyMode || pendingState.text || pendingState.video || !videoUnlocked;
  elements.resetGenerated.disabled = readonlyMode || pendingState.text || !(generatedBundle || imageAsset?.dataUrl || videoAsset?.id);
  elements.downloadImage.disabled = !imageAsset?.dataUrl;
  elements.refreshVideo.disabled = !videoAsset?.id || pendingState.video || videoAsset?.demo;
  elements.downloadVideo.disabled = !videoIsReady(videoAsset) || videoAsset?.demo;
}

function renderSessionStrip() {
  const packet = getPacket();
  const audience = getAudience();
  const workspace = getWorkspace();
  const bundle = getBundle();
  const nextTitle = elements.nextActionTitle.textContent || "Continue the workflow";
  const nextText = elements.nextActionText.textContent || "";

  elements.sessionPacket.textContent = packet.label;
  elements.sessionAudience.textContent = audience.label;
  elements.sessionFormat.textContent = bundle.label;
  elements.sessionModel.textContent = getAiSettings().textModel;
  elements.sessionNext.textContent = `${nextTitle}${nextText ? `: ${nextText}` : ""}`;

  elements.textModelSelect.disabled = readonlyMode;
  elements.reviewModelSelect.disabled = readonlyMode;
  elements.imageModelSelect.disabled = readonlyMode;
  elements.videoModelSelect.disabled = readonlyMode;
  elements.generateIntakeBrief.disabled = readonlyMode || pendingState.text;
  elements.generateClaimMap.disabled = readonlyMode || pendingState.text;
}

function renderAiSettings() {
  const aiSettings = getAiSettings();
  const fields = [
    [elements.textModelSelect, runtimeConfig?.text?.availableModels || [aiSettings.textModel], aiSettings.textModel],
    [elements.reviewModelSelect, runtimeConfig?.review?.availableModels || [aiSettings.reviewModel], aiSettings.reviewModel],
    [elements.imageModelSelect, runtimeConfig?.image?.availableModels || [aiSettings.imageModel], aiSettings.imageModel],
    [elements.videoModelSelect, runtimeConfig?.video?.availableModels || [aiSettings.videoModel], aiSettings.videoModel]
  ];

  for (const [select, models, selected] of fields) {
    const options = models.length ? models : [selected];
    if (select.dataset.options !== options.join("|")) {
      select.innerHTML = options.map((model) => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`).join("");
      select.dataset.options = options.join("|");
    }
    select.value = options.includes(selected) ? selected : options[0];
  }
}

function renderPackagingPresets() {
  const selected = getPackagingPreset();
  document.querySelectorAll("[data-packaging-preset]").forEach((button) => {
    const active = button.dataset.packagingPreset === selected;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderAngleOptions() {
  const options = getAngleOptions();
  const selectedAngle = getSelectedAngle();

  if (!options.length) {
    elements.angleOptionsList.innerHTML = `<article class="angle-option empty-state">Generate angles to compare myth-reset, context, and nuance-first packaging choices.</article>`;
    setPillState(elements.angleStatus, "Not run");
    return;
  }

  elements.angleOptionsList.innerHTML = options.map((angle, index) => `
    <button
      class="angle-option${angle.label === selectedAngle?.label ? " is-active" : ""}"
      type="button"
      data-angle-index="${index}"
      aria-pressed="${angle.label === selectedAngle?.label ? "true" : "false"}"
      ${readonlyMode ? "disabled" : ""}
    >
      <span class="detail-kicker">${escapeHtml(angle.label)}</span>
      <strong>${escapeHtml(angle.hook)}</strong>
      <p>${escapeHtml(angle.audienceFit)}</p>
      <ul class="detail-list">
        <li>${escapeHtml(angle.riskNote)}</li>
        <li>${escapeHtml(angle.avoidWhen)}</li>
      </ul>
    </button>
  `).join("");
  setPillState(
    elements.angleStatus,
    selectedAngle ? `${options.length} ready | ${selectedAngle.label}` : `${options.length} ready`,
    "is-ready"
  );
}

function renderIntakeBrief() {
  const intakeBrief = getIntakeBrief();
  if (!intakeBrief) {
    elements.intakeBriefSummary.textContent = "Run the intake brief to clarify the job before moving to claim review.";
    elements.intakeBriefThink.textContent = "";
    elements.intakeBriefRecord.textContent = "";
    elements.intakeBriefMissing.textContent = "";
    setPillState(elements.intakeBriefStatus, "Not run");
    return;
  }

  elements.intakeBriefSummary.textContent = intakeBrief.summary;
  elements.intakeBriefThink.textContent = intakeBrief.peopleThink;
  elements.intakeBriefRecord.textContent = intakeBrief.recordSays;
  elements.intakeBriefMissing.textContent = intakeBrief.missing;
  setPillState(elements.intakeBriefStatus, intakeBrief.model || "Ready", "is-ready");
}

function renderClaimMap() {
  const claimMap = getClaimMap();
  if (!claimMap) {
    elements.claimMapFraming.textContent = "Run the claim map to see what the packet can support before drafting.";
    elements.claimMapSupported.innerHTML = createListMarkup([], "No supported points yet.");
    elements.claimMapOpen.innerHTML = createListMarkup([], "No open questions yet.");
    elements.claimMapRisks.innerHTML = createListMarkup([], "No language risks yet.");
    setPillState(elements.claimMapStatus, "Not run");
    return;
  }

  elements.claimMapFraming.textContent = claimMap.framing;
  elements.claimMapSupported.innerHTML = createListMarkup(claimMap.supportedPoints, "No supported points.");
  elements.claimMapOpen.innerHTML = createListMarkup(claimMap.openQuestions, "No open questions.");
  elements.claimMapRisks.innerHTML = createListMarkup(claimMap.languageRisks, "No language risks.");
  setPillState(elements.claimMapStatus, claimMap.model || "Ready", "is-ready");
}

function renderReviewFindings() {
  const findings = getReviewFindings();
  if (!findings) {
    elements.reviewVerdict.textContent = "Run the review copilot after drafting to surface citation, tone, and certainty issues.";
    elements.reviewSummary.textContent = "";
    elements.reviewStrengths.innerHTML = createListMarkup([], "No strengths logged yet.");
    elements.reviewRisks.innerHTML = createListMarkup([], "No risks logged yet.");
    elements.reviewFixes.innerHTML = createListMarkup([], "No fixes logged yet.");
    setPillState(elements.reviewFindingsStatus, "Not run");
    return;
  }

  elements.reviewVerdict.textContent = findings.verdict;
  elements.reviewSummary.textContent = findings.summary;
  elements.reviewStrengths.innerHTML = createListMarkup(findings.strengths, "No strengths logged.");
  elements.reviewRisks.innerHTML = createListMarkup(findings.risks, "No risks logged.");
  elements.reviewFixes.innerHTML = createListMarkup(findings.fixes, "No fixes logged.");
  setPillState(elements.reviewFindingsStatus, findings.model || "Ready", findings.verdict === "ready" ? "is-ready" : "is-busy");
}

function renderRunHistory() {
  const runs = getGenerationRuns();
  elements.runHistoryList.innerHTML = runs.length
    ? runs.map(runMarkup).join("")
    : `<li class="empty-state">AI runs will appear here after you start the workflow.</li>`;
}

function renderHero() {
  const packet = getPacket();
  const audience = getAudience();
  const bundle = getBundle();
  const queue = store.workspace?.queue || [];
  const claim = getClaim();

  elements.heroQuestion.textContent = queue[0] || packet.question;
  elements.heroBefore.textContent = packet.summary;
  elements.heroAfter.textContent = bundle.caption;
  elements.heroOutputLabel.textContent = `${bundle.label} ready for ${audience.label.toLowerCase()} mode`;
  elements.visualPacket.textContent = packet.shortLabel;
  elements.visualClaim.textContent = claim.title;
  elements.visualShareSummary.textContent = bundle.shareSummary;
  elements.visualHook.textContent = bundle.hook;
  elements.visualSlides.innerHTML = createListMarkup(bundle.slides.slice(0, 3));
  elements.visualComment.textContent = bundle.commentPrompt;
  elements.visualSource.textContent = bundle.citations.slice(0, 2).join(" + ");
}

function renderAudience() {
  const packet = getPacket();
  const audience = getAudience(packet.id);

  elements.audienceTabs.innerHTML = store.audiences.map((candidate) => audienceTabMarkup(candidate, packet.id)).join("");
  elements.audienceKicker.textContent = audience.kicker;
  elements.audienceTitle.textContent = audience.title;
  elements.audienceSummary.textContent = audience.summary;
  elements.audienceFocus.innerHTML = createListMarkup(audience.focus);
  elements.questionInput.placeholder = audience.questionPlaceholder;
  elements.saveStatus.textContent = saveStatusText(store.workspace?.lastSavedAt);
}

function renderQueue() {
  const queue = store.workspace?.queue || [];
  elements.queueCount.textContent = `${queue.length}`;
  elements.queueList.innerHTML = createListMarkup(queue, "Add a real creator question and it will appear here.");
}

function renderPackets() {
  elements.packetList.innerHTML = store.packets.map(packetTabMarkup).join("");
  elements.packetCount.textContent = `${store.packets.length} packets`;
}

function renderPacketDetail() {
  const packet = getPacket();

  elements.packetType.textContent = packet.type;
  elements.packetType.dataset.status = "packet";
  elements.packetDate.textContent = packet.date;
  elements.packetTrust.textContent = packet.trust;
  elements.packetTitle.textContent = packet.label;
  elements.packetSummary.textContent = packet.summary;
  elements.packetQuestion.textContent = packet.question;
  elements.packetSources.innerHTML = createListMarkup(packet.sources);
}

function renderClaims() {
  const packet = getPacket();
  elements.claimList.innerHTML = packet.claims.map((claim, index) => claimTabMarkup(claim, index, packet.id)).join("");
  elements.claimCount.textContent = `${packet.claims.length} claims`;
}

function renderClaimDetail() {
  const claim = getClaim();

  elements.claimTitle.textContent = claim.title;
  elements.claimStatus.textContent = claimStatusText(claim.status);
  elements.claimStatus.dataset.status = claim.status;
  elements.claimSummary.textContent = claim.summary;
  elements.claimEvidence.textContent = claim.evidence;
  elements.claimGap.textContent = claim.gap;
  elements.claimCitations.innerHTML = createListMarkup(claim.citations);
  elements.claimSignals.innerHTML = createListMarkup(claim.signals);
}

function renderFormats() {
  const audience = getAudience();
  const workspace = getWorkspace();

  document.querySelectorAll(".format-tab").forEach((button) => {
    const active = button.dataset.format === workspace.selectedFormat;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
    button.disabled = readonlyMode;
  });

  elements.draftState.textContent = workspace.reviewStatus === "approved"
    ? "Approved handoff"
    : workspace.reviewStatus === "revision"
      ? "Needs revision"
      : `${audience.label} draft`;
}

function renderDraft() {
  const audience = getAudience();
  const draft = getDraft();
  const bundle = getBundle();
  const generatedBundle = getGeneratedBundle();
  const packagingPreset = PACKAGING_PRESETS[getPackagingPreset()]?.label || "Fast myth check";
  const selectedAngle = getSelectedAngle();

  elements.draftKicker.textContent = generatedBundle
    ? `${bundle.label} / AI-assisted ${audience.label.toLowerCase()} mode`
    : `${bundle.label} / ${audience.label} mode`;
  elements.draftTitle.textContent = bundle.title;
  elements.draftSummary.textContent = generatedBundle
    ? `Fresh AI pass built from the current packet, claim, and audience framing. Packaging mode: ${packagingPreset}.${selectedAngle ? ` Selected angle: ${selectedAngle.label}.` : ""} ${audience.draftRule}`
    : `${draft.summary} Packaging mode: ${packagingPreset}.${selectedAngle ? ` Selected angle: ${selectedAngle.label}.` : ""} ${audience.draftRule}`;
  elements.draftHook.textContent = bundle.hook;
  elements.draftCaption.textContent = bundle.caption;
  elements.draftScript.textContent = bundle.script;
  elements.draftCommentPrompt.textContent = bundle.commentPrompt;
  elements.draftSlides.innerHTML = createListMarkup(bundle.slides);
  elements.draftCitations.innerHTML = createListMarkup(bundle.citations);
  elements.draftShareSummary.textContent = bundle.shareSummary;
  elements.draftNote.textContent = bundle.note;
}

function renderRisks() {
  const packet = getPacket();
  elements.manipulationList.innerHTML = createListMarkup(packet.manipulation);
  elements.amplificationNote.textContent = packet.amplification;
}

function renderChecklist() {
  const workspace = getWorkspace();
  const completed = workspace.checklist.filter((item) => item.done).length;

  elements.reviewChecklist.innerHTML = workspace.checklist.map(checklistItemMarkup).join("");
  elements.checklistProgress.textContent = `${completed} / ${workspace.checklist.length}`;
}

function renderReviewerNotes() {
  elements.reviewerNotes.value = getWorkspace().reviewerNotes || "";
  elements.reviewerNotes.disabled = readonlyMode;
}

function renderGateStatus() {
  const workspace = getWorkspace();
  const blockers = getBlockers(workspace);
  const readyToApprove = !blockers.length;
  const approved = workspace.reviewStatus === "approved";

  elements.blockerList.innerHTML = createListMarkup(
    blockers,
    approved ? "No blockers. This handoff is approved and export-ready." : "No blockers. Approval is ready."
  );

  if (approved) {
    elements.gateStatusCard.dataset.state = "approved";
    elements.gateStatusTitle.textContent = "Approved for creator or educator handoff";
    elements.gateStatusText.textContent = "The packet passed review and the export package is now unlocked.";
  } else if (workspace.reviewStatus === "revision") {
    elements.gateStatusCard.dataset.state = "revision";
    elements.gateStatusTitle.textContent = "Sent back for revision";
    elements.gateStatusText.textContent = "Fix the sourcing, tone, or uncertainty gaps, then run the checks again.";
  } else if (readyToApprove) {
    elements.gateStatusCard.dataset.state = "pending";
    elements.gateStatusTitle.textContent = "Checklist complete. Approval is available.";
    elements.gateStatusText.textContent = "Everything needed for approval is done. The next action is to unlock the export package.";
  } else {
    elements.gateStatusCard.dataset.state = "pending";
    elements.gateStatusTitle.textContent = "Export is still blocked";
    elements.gateStatusText.textContent = "Finish the incomplete checks before the handoff can be approved.";
  }

  elements.approveReview.disabled = readonlyMode || !readyToApprove;
  elements.requestRevision.disabled = readonlyMode;
}

function renderExportCard() {
  const packet = getPacket();
  const audience = getAudience();
  const bundle = getBundle();
  const workspace = getWorkspace();
  const generatedBundle = getGeneratedBundle();
  const imageAsset = getImageAsset();
  const videoAsset = getVideoAsset();
  const claim = getClaim();
  const selectedAngle = getSelectedAngle();
  const packagingPreset = PACKAGING_PRESETS[getPackagingPreset()]?.label || "Fast myth check";
  const reviewFindings = getReviewFindings();
  const intakeBrief = getIntakeBrief();
  const claimMap = getClaimMap();
  const approved = workspace.reviewStatus === "approved";
  const blockers = getBlockers(workspace);
  const exportedFormats = workspace.exportedFormats || [];
  const shareUrl = approved ? (workspace.shareUrl || getShareUrl(packet.id)) : "";
  const assetSummary = [
    generatedBundle ? "AI-assisted draft attached." : "",
    imageAsset?.dataUrl ? "Cover visual ready." : "",
    videoIsReady(videoAsset) ? "Short video ready." : videoAsset?.id ? "Short video is still rendering." : ""
  ].filter(Boolean).join(" ");

  elements.exportTitle.textContent = approved
    ? "Handoff ready to ship"
    : "Finish review to unlock export";
  elements.exportSummary.textContent = approved
    ? `${bundle.label} is ready for ${audience.label.toLowerCase()} mode. ${assetSummary || "Receipts stay attached."} ${exportedFormats.length ? `Already exported: ${exportedFormats.join(", ")}.` : ""}`
    : "Approve the packet to unlock copy, preview, and sharing.";
  elements.shareLink.textContent = shareUrl || "Share preview will appear here after approval.";
  elements.exportPackaging.textContent = packagingPreset;
  elements.exportConfidence.textContent = claimStatusText(claim.status);
  elements.exportAngle.textContent = selectedAngle
    ? `${selectedAngle.label}: ${selectedAngle.hook}`
    : "Generate an angle stack to compare how this truth can travel.";
  elements.exportModels.textContent = `${getAiSettings().textModel} draft + ${getAiSettings().reviewModel} review`;
  elements.exportAssets.textContent = assetSummary || "No generated media attached yet.";
  elements.exportPreviewTitle.textContent = selectedAngle?.hook || bundle.hook;
  elements.exportPreviewSummary.textContent = intakeBrief?.summary || bundle.shareSummary;
  elements.exportPreviewPrompt.textContent = bundle.commentPrompt;
  elements.exportPreviewGuardrail.textContent = reviewFindings?.risks?.[0]
    || claimMap?.languageRisks?.[0]
    || "Keep the uncertainty line visible if the packet does not support a full conclusion.";

  elements.exportHandoffStatus.dataset.status = approved ? "supported" : "draft";
  elements.exportHandoffStatus.textContent = approved ? "Handoff ready" : "Review locked";
  elements.exportPreviewStatus.dataset.status = approved ? "packet" : "draft";
  elements.exportPreviewStatus.textContent = approved ? "Preview available" : "Preview locked";
  elements.exportGuidance.textContent = approved
    ? "Best next move: copy the handoff or open the preview before sharing it wider."
    : blockers.length
      ? `Best next move: clear ${blockers.length} blocker${blockers.length === 1 ? "" : "s"} in the review gate.`
      : "Best next move: approve the handoff to unlock export actions.";

  elements.copyOutput.disabled = !approved;
  elements.downloadOutput.disabled = !approved;
  elements.copyShareLink.disabled = !approved;
  elements.openSharePreview.disabled = !approved;
  elements.duplicateAudience.disabled = readonlyMode;
}

function renderHistory() {
  const history = getWorkspace().history || [];
  elements.historyList.innerHTML = history.length
    ? history.map(historyMarkup).join("")
    : `<li class="empty-state">Actions will appear here as the review moves.</li>`;
}

function renderStepRail() {
  const packet = getPacket();
  const workspace = getWorkspace();
  const claim = getClaim();
  const blockers = getBlockers(workspace);
  const bundle = getBundle();
  const completedChecks = workspace.checklist.filter((item) => item.done).length;
  const verifyComplete = completedChecks > 0 || workspace.selectedClaimIndex > 0;
  const draftComplete = Boolean(bundle?.caption);
  const stageState = {
    intake: Boolean(store.workspace.queue.length),
    verify: verifyComplete,
    draft: draftComplete,
    export: workspace.reviewStatus === "approved"
  };

  elements.stepIntakeStatus.textContent = store.workspace.queue.length ? `${store.workspace.queue.length} queued` : "Ready";
  elements.stepVerifyStatus.textContent = claimStatusText(claim.status);
  elements.stepDraftStatus.textContent = getGeneratedBundle() ? "AI draft ready" : bundle.label;
  elements.stepExportStatus.textContent = workspace.reviewStatus === "approved"
    ? "Approved"
    : blockers.length
      ? `${blockers.length} blockers`
      : "Ready";

  elements.questionInput.disabled = readonlyMode;
  elements.saveStatus.textContent = saveStatusText(store.workspace.lastSavedAt);
  elements.stageHost.classList.add("has-active");

  document.querySelectorAll(".step-card[data-stage-trigger]").forEach((button) => {
    const stage = button.dataset.stageTrigger;
    const isActive = stage === activeStage;
    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-complete", !isActive && stageState[stage]);
    button.classList.toggle("is-blocked", stage === "export" && blockers.length > 0 && workspace.reviewStatus !== "approved");
    button.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll("[data-stage-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.stagePanel === activeStage);
  });

  document.title = `Puentes | ${packet.shortLabel} -> ${bundle.label}`;
}

function revealActiveStepCard() {
  if (!window.matchMedia("(max-width: 640px)").matches) {
    return;
  }

  const activeCard = document.querySelector(".step-card.is-active");
  if (activeCard) {
    activeCard.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }
}

function renderReadonlyState() {
  document.body.classList.toggle("is-share-mode", readonlyMode);
  elements.readonlyBanner.hidden = !readonlyMode;
}

function renderNextAction() {
  const workspace = getWorkspace();
  const blockers = getBlockers(workspace);
  const packet = getPacket();
  const audience = getAudience();

  let config = {
    stage: "intake",
    label: "Now do this",
    title: "Start with intake",
    text: "Pick the audience and add the real question.",
    button: "Go to intake"
  };

  if (readonlyMode) {
    config = {
      stage: "export",
      label: "Read-only mode",
      title: "Review the creator handoff",
      text: "Inspect the final output, citations, and share summary.",
      button: "Open export"
    };
  } else if (!store.workspace.queue.length) {
    config = {
      stage: "intake",
      label: "First move",
      title: "Add the question people are actually asking",
      text: "That one prompt makes the workflow click.",
      button: "Add a question"
    };
  } else if (!allChecklistDone(workspace) && activeStage !== "verify" && activeStage !== "draft") {
    config = {
      stage: "verify",
      label: "Recommended next step",
      title: `Pressure-test ${packet.shortLabel.toLowerCase()} before you package it`,
      text: "Open the loudest claim and clear the blockers before approval.",
      button: "Go to verify"
    };
  } else if (activeStage === "draft" && !getGeneratedBundle()) {
    config = {
      stage: "draft",
      label: "Make it sharper",
      title: `Generate a stronger ${audience.label.toLowerCase()} cut from the verified packet`,
      text: "Start with a fresh draft, then add visual polish if needed.",
      button: "Open draft studio"
    };
  } else if (workspace.reviewStatus !== "approved") {
    config = {
      stage: "export",
      label: "Almost there",
      title: `Approve the ${audience.label.toLowerCase()} handoff to unlock export`,
      text: blockers.length
        ? `${blockers.length} review item${blockers.length === 1 ? "" : "s"} still block export.`
        : "The packet is ready for approval and share preview generation.",
      button: "Go to export"
    };
  } else {
    config = {
      stage: "export",
      label: "Ready to move",
      title: "Copy, download, or share the creator handoff",
      text: "The export package is unlocked. Hand it off, remix it for another audience, or open the read-only preview.",
      button: "Open export"
    };
  }

  elements.nextActionLabel.textContent = config.label;
  elements.nextActionTitle.textContent = config.title;
  elements.nextActionText.textContent = config.text;
  elements.nextActionButton.textContent = config.button;
  elements.nextActionButton.dataset.stageTrigger = config.stage;
}

function renderAll() {
  renderReadonlyState();
  renderHero();
  renderAudience();
  renderAiSettings();
  renderPackagingPresets();
  renderIntakeBrief();
  renderQueue();
  renderPackets();
  renderPacketDetail();
  renderClaims();
  renderClaimDetail();
  renderClaimMap();
  renderAngleOptions();
  renderFormats();
  renderDraft();
  renderAiStudio();
  renderRisks();
  renderChecklist();
  renderReviewerNotes();
  renderReviewFindings();
  renderGateStatus();
  renderExportCard();
  renderHistory();
  renderRunHistory();
  renderStepRail();
  renderNextAction();
  renderSessionStrip();
}

function setActiveStage(stage) {
  if (!STAGES.includes(stage)) {
    return;
  }

  activeStage = stage;
  if (store.workspace) {
    renderStepRail();
    revealActiveStepCard();
  }
}

function chooseDefaultStage() {
  const workspace = getWorkspace();

  if (!workspace) {
    activeStage = "intake";
    return;
  }

  if (readonlyMode || workspace.reviewStatus === "approved") {
    activeStage = "export";
    return;
  }
}

function hydrateStore(data) {
  store.audiences = data.audiences;
  store.packets = data.packets;
  store.workspace = data.workspace;
  runtimeConfig = data.ai || runtimeConfig || getDefaultRuntimeConfig();
}

function switchToLocalMode(message) {
  if (persistenceMode === "local") {
    return;
  }

  persistenceMode = "local";
  saveLocalSnapshot();
  setAppStatus(message || "API unavailable. Running in local demo mode.", "loading");
}

function persistStateLocal({ appPatch = {}, packetId, workspacePatch = {} }, action, detail) {
  if (appPatch.activePacketId && getPacket(appPatch.activePacketId)) {
    store.workspace.activePacketId = appPatch.activePacketId;
  }

  if (Object.prototype.hasOwnProperty.call(appPatch, "queue")) {
    store.workspace.queue = clone(appPatch.queue);
  }

  const targetPacketId = getPacket(packetId)?.id || store.workspace.activePacketId;
  const currentWorkspace = getWorkspace(targetPacketId);

  if (Object.keys(workspacePatch).length) {
    const nextWorkspace = { ...currentWorkspace, ...clone(workspacePatch) };

    if (Object.prototype.hasOwnProperty.call(workspacePatch, "selectedAudienceId")
      && !Object.prototype.hasOwnProperty.call(workspacePatch, "selectedFormat")) {
      nextWorkspace.selectedFormat = getAudienceDefaultFormat(nextWorkspace.selectedAudienceId);
    }

    store.workspace.workspaceStateByPacket[targetPacketId] = normalizeLocalWorkspace(targetPacketId, nextWorkspace);
  }

  appendLocalHistory(targetPacketId, action, detail);
  store.workspace.lastSavedAt = new Date().toISOString();
  saveLocalSnapshot();
  applyShareModeFromUrl();
  chooseDefaultStage();
  renderAll();
}

function queueQuestionLocal(question) {
  store.workspace.queue = [sanitizeLocalText(question, 240), ...(store.workspace.queue || [])].filter(Boolean).slice(0, 8);
  appendLocalHistory(store.workspace.activePacketId, "Queued question", question);
  store.workspace.lastSavedAt = new Date().toISOString();
  saveLocalSnapshot();
  chooseDefaultStage();
  renderAll();
}

function applyShareModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const sharedPacketId = params.get("share");

  readonlyMode = Boolean(sharedPacketId && store.packets.some((packet) => packet.id === sharedPacketId));
  if (!readonlyMode) {
    return;
  }

  activeStage = "export";

  store.workspace.activePacketId = sharedPacketId;

  const workspace = getWorkspace(sharedPacketId);
  const packet = getPacket(sharedPacketId);
  const requestedAudience = params.get("audience");
  const requestedFormat = params.get("format");

  if (requestedAudience && store.audiences.some((audience) => audience.id === requestedAudience)) {
    workspace.selectedAudienceId = requestedAudience;
  }

  if (requestedFormat && packet.outputBundles[requestedFormat]) {
    workspace.selectedFormat = requestedFormat;
  }
}

function applyStageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedStage = params.get("stage");

  if (!requestedStage || !STAGES.includes(requestedStage)) {
    return;
  }

  if (readonlyMode && requestedStage !== "export") {
    return;
  }

  activeStage = requestedStage;
}

async function bootstrap() {
  try {
    const data = await requestJson("/api/bootstrap");
    persistenceMode = "api";
    hydrateStore(data);
  } catch (error) {
    const snapshot = loadLocalSnapshot();
    if (!snapshot) {
      throw error;
    }

    persistenceMode = "local";
    hydrateStore(snapshot);
    setAppStatus("Running in local demo mode because the API is unavailable.", "loading");
  }

  applyShareModeFromUrl();
  applyStageFromUrl();
  renderAll();
}

async function persistState({ appPatch = {}, packetId, workspacePatch = {} }, action, detail) {
  if (persistenceMode === "local") {
    persistStateLocal({ appPatch, packetId, workspacePatch }, action, detail);
    return;
  }

  try {
    const data = await requestJson("/api/state", {
      method: "POST",
      body: JSON.stringify({ appPatch, packetId, workspacePatch, action, detail })
    });

    store.workspace = data.workspace;
    applyShareModeFromUrl();
    chooseDefaultStage();
    renderAll();
  } catch (error) {
    switchToLocalMode("API unavailable. Switched to local demo mode.");
    persistStateLocal({ appPatch, packetId, workspacePatch }, action, detail);
  }
}

async function queueQuestion(question) {
  if (persistenceMode === "local") {
    queueQuestionLocal(question);
    return;
  }

  try {
    const data = await requestJson("/api/queue", {
      method: "POST",
      body: JSON.stringify({ question })
    });

    store.workspace = data.workspace;
    applyShareModeFromUrl();
    chooseDefaultStage();
    renderAll();
  } catch (error) {
    switchToLocalMode("API unavailable. Switched to local demo mode.");
    queueQuestionLocal(question);
  }
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  document.body.removeChild(helper);
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function clearVideoPoll(packetId = getPacket()?.id, format = getWorkspace(packetId)?.selectedFormat) {
  const key = `${packetId}:${format}`;
  const timer = videoPollTimers.get(key);
  if (timer) {
    window.clearTimeout(timer);
    videoPollTimers.delete(key);
  }
}

function scheduleDemoVideoReady(packetId, format, delay = DEMO_VIDEO_DELAY_MS) {
  clearVideoPoll(packetId, format);
  const key = `${packetId}:${format}`;
  const timer = window.setTimeout(() => {
    const packetMedia = ensurePacketMediaState(packetId);
    const currentAsset = packetMedia.videosByFormat?.[format];

    if (!currentAsset?.demo) {
      videoPollTimers.delete(key);
      return;
    }

    packetMedia.videosByFormat[format] = {
      ...currentAsset,
      status: "ready",
      readyAt: new Date().toISOString()
    };

    videoPollTimers.delete(key);
    saveMediaSnapshot();
    renderAll();
    flashFeedback("Demo video concept is ready.");
    setAppStatus("Demo video concept is ready.", "success", true);
  }, delay);

  videoPollTimers.set(key, timer);
}

function scheduleVideoPoll(packetId, format, delay = 6000) {
  clearVideoPoll(packetId, format);
  const key = `${packetId}:${format}`;
  const timer = window.setTimeout(() => {
    refreshVideoStatus(packetId, format, true);
  }, delay);
  videoPollTimers.set(key, timer);
}

async function refreshVideoStatus(packetId = getPacket()?.id, format = getWorkspace(packetId)?.selectedFormat, silent = false) {
  const videoAsset = getVideoAsset(packetId, format);
  if (!videoAsset?.id) {
    return null;
  }

  if (videoAsset.demo) {
    if (!silent) {
      setAppStatus(
        videoIsReady(videoAsset) ? "Demo video concept is ready." : "Demo video concept is still rendering locally.",
        videoIsReady(videoAsset) ? "success" : "loading",
        videoIsReady(videoAsset)
      );
    }
    return videoAsset;
  }

  try {
    if (!silent) {
      setAppStatus("Refreshing video status...", "loading");
    }

    const payload = await requestJson(`/api/video-status?id=${encodeURIComponent(videoAsset.id)}`);
    const status = payload.video?.status || payload.video?.state || "processing";
    const packetMedia = ensurePacketMediaState(packetId);

    packetMedia.videosByFormat[format] = {
      ...videoAsset,
      ...payload.video,
      status,
      download: payload.download,
      checkedAt: new Date().toISOString()
    };

    saveMediaSnapshot();
    await persistState({
      packetId,
      workspacePatch: {
        generationRuns: syncLatestRunStatus(getWorkspace(packetId), "generate_video", readableVideoStatus(status))
      }
    }, "", "");

    if (readableVideoStatus(status) === "processing" || readableVideoStatus(status) === "queued") {
      scheduleVideoPoll(packetId, format);
    } else {
      clearVideoPoll(packetId, format);
    }

    renderAll();

    if (!silent) {
      setAppStatus(
        readableVideoStatus(status) === "ready" ? "Video is ready." : "Video status updated.",
        readableVideoStatus(status) === "error" ? "error" : "success",
        true
      );
    }

    return packetMedia.videosByFormat[format];
  } catch (error) {
    const packetMedia = ensurePacketMediaState(packetId);
    packetMedia.videosByFormat[format] = {
      ...videoAsset,
      status: "error",
      error: error.message,
      checkedAt: new Date().toISOString()
    };
    saveMediaSnapshot();
    await persistState({
      packetId,
      workspacePatch: {
        generationRuns: syncLatestRunStatus(getWorkspace(packetId), "generate_video", "error")
      }
    }, "", "");
    renderAll();

    if (!silent) {
      setAppStatus(error.message, "error");
    }

    return null;
  }
}

async function runSmokeDemoFlow() {
  setActiveStage("draft");
  setAppStatus("Running demo smoke flow...", "loading");

  await generateTextDraft(elements.generateText);
  if (!(await waitForCondition(() => Boolean(getGeneratedBundle()), 5000))) {
    throw new Error("Smoke flow failed before the draft rendered.");
  }

  await generateImageConcept(elements.generateImage);
  if (!(await waitForCondition(() => Boolean(getImageAsset()?.dataUrl), 5000))) {
    throw new Error("Smoke flow failed before the visual rendered.");
  }

  if (!elements.generateVideo.disabled) {
    await generateVideoConcept(elements.generateVideo);
    if (!(await waitForCondition(() => videoIsReady(getVideoAsset()), 7000))) {
      throw new Error("Smoke flow failed before the video concept reached ready state.");
    }
  }

  setAppStatus("Demo smoke flow completed.", "success", true);
}

function buildTextGenerationRequest(extraInstructions = []) {
  const packet = getPacket();
  const audience = getAudience();
  const claim = getClaim();
  const workspace = getWorkspace();
  const aiSettings = getAiSettings();
  const packagingPreset = getPackagingPreset();
  const selectedAngle = getSelectedAngle();
  const seedBundle = packet.outputBundles[workspace.selectedFormat] || getBundle();
  const currentBundle = getBundle();
  const currentQueue = store.workspace?.queue?.[0] || packet.question;
  const presetInstructions = PACKAGING_PRESETS[packagingPreset]?.instructions || [];
  const selectedAngleInstructions = selectedAngle
    ? [
      `Use this selected editorial angle label: ${selectedAngle.label}.`,
      `Lean into this hook direction: ${selectedAngle.hook}.`,
      `Respect this risk note: ${selectedAngle.riskNote}.`
    ]
    : [];

  return {
    packet,
    audience,
    claim,
    workspace,
    seedBundle,
    body: {
      audience: audience.id,
      packetId: packet.id,
      claimIndex: workspace.selectedClaimIndex,
      goal: `Create a ${seedBundle.label.toLowerCase()} for ${audience.label.toLowerCase()} mode.`,
      format: workspace.selectedFormat,
      taskType: "creator_bundle",
      model: aiSettings.textModel,
      packetTitle: packet.label,
      packetSummary: packet.summary,
      coreQuestion: currentQueue,
      claim: `${claim.title} ${claim.summary}`,
      evidence: claim.evidence,
      gaps: claim.gap,
      citations: currentBundle?.citations?.length ? currentBundle.citations : claim.citations,
      manipulationSignals: [...packet.manipulation, ...claim.signals].slice(0, 5),
      additionalContext: `${audience.draftRule} ${packet.amplification}`,
      packagingPreset,
      currentDraft: currentBundle ? {
        title: currentBundle.title,
        hook: currentBundle.hook,
        caption: currentBundle.caption,
        script: currentBundle.script,
        slides: currentBundle.slides,
        commentPrompt: currentBundle.commentPrompt,
        citations: currentBundle.citations,
        shareSummary: currentBundle.shareSummary,
        note: currentBundle.note
      } : {},
      instructions: [...presetInstructions, ...selectedAngleInstructions, ...extraInstructions]
    }
  };
}

function buildRunEntry(type, model, target, status = "ready") {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    model,
    target,
    status,
    generatedAt: new Date().toISOString()
  };
}

function withRunEntry(workspace, runEntry) {
  return [runEntry, ...(workspace.generationRuns || [])].slice(0, 24);
}

function syncLatestRunStatus(workspace, type, status) {
  let updated = false;
  const runs = (workspace.generationRuns || []).map((run) => {
    if (!updated && run.type === type) {
      updated = true;
      return { ...run, status };
    }
    return run;
  });
  return updated ? runs : withRunEntry(workspace, buildRunEntry(type, getAiSettings().videoModel, workspace.selectedFormat, status));
}

async function runTextGeneration({
  extraInstructions = [],
  statusMessage,
  successMessage,
  feedbackMessage,
  historyAction,
  historyDetail,
  demoPresetKey = "fresh",
  button,
  busyLabel,
  doneLabel
}) {
  const request = buildTextGenerationRequest(extraInstructions);

  pendingState.text = true;
  setButtonBusy(button, busyLabel || "Working...");
  renderAiStudio();
  setAppStatus(statusMessage, "loading");

  try {
    const payload = await requestJson("/api/generate-text", {
      method: "POST",
      body: JSON.stringify(request.body)
    });

    const generatedBundlesByFormat = {
      ...(request.workspace.generatedBundlesByFormat || {}),
      [request.workspace.selectedFormat]: normalizeGeneratedBundlePayload(payload, {
        packet: request.packet,
        baseBundle: request.seedBundle
      })
    };
    const generationRuns = withRunEntry(
      request.workspace,
      buildRunEntry("creator_bundle", sanitizeLocalText(payload.model, 80), request.workspace.selectedFormat)
    );

    await persistState(
      {
        packetId: request.packet.id,
        workspacePatch: {
          generatedBundlesByFormat,
          generationRuns,
          reviewStatus: "pending",
          shareReady: false,
          shareUrl: ""
        }
      },
      historyAction,
      historyDetail || `${request.packet.label} -> ${request.workspace.selectedFormat}`
    );

    flashFeedback(feedbackMessage);
    pulseButtonDone(button, doneLabel || "Updated");
    setAppStatus(successMessage, "success", true);
  } catch (error) {
    if (useDemoTextFallback(error)) {
      const generatedBundlesByFormat = {
        ...(request.workspace.generatedBundlesByFormat || {}),
        [request.workspace.selectedFormat]: buildDemoGeneratedBundle(request, demoPresetKey)
      };
      const generationRuns = withRunEntry(
        request.workspace,
        buildRunEntry("creator_bundle", "puentes-demo", request.workspace.selectedFormat)
      );

      await persistState(
        {
          packetId: request.packet.id,
          workspacePatch: {
            generatedBundlesByFormat,
            generationRuns,
            reviewStatus: "pending",
            shareReady: false,
            shareUrl: ""
          }
        },
        historyAction,
        historyDetail || `${request.packet.label} -> ${request.workspace.selectedFormat}`
      );

      flashFeedback("Demo draft generated locally.");
      pulseButtonDone(button, doneLabel || "Updated");
      setAppStatus("Demo draft generated locally.", "success", true);
    } else {
      clearButtonBusy(button);
      setAppStatus(error.message, "error");
    }
  } finally {
    pendingState.text = false;
    renderAll();
  }
}

async function generateTextDraft(button = elements.generateText) {
  await runTextGeneration({
    statusMessage: "Generating a fresh creator draft...",
    successMessage: "AI draft generated.",
    feedbackMessage: "Fresh AI draft is ready to review.",
    historyAction: "Generated AI draft",
    demoPresetKey: "fresh",
    button,
    busyLabel: "Generating draft...",
    doneLabel: "Draft ready"
  });
}

async function refineTextDraft(presetKey, button) {
  const preset = REFINE_PRESETS[presetKey];
  if (!preset) {
    return;
  }

  await runTextGeneration({
    extraInstructions: preset.instructions,
    statusMessage: preset.status,
    successMessage: `${preset.label} is ready.`,
    feedbackMessage: `${preset.label} applied.`,
    historyAction: preset.action,
    historyDetail: `${getPacket().label} -> ${preset.label}`,
    demoPresetKey: presetKey,
    button,
    busyLabel: "Updating...",
    doneLabel: "Updated"
  });
}

async function generateIntakeBrief(button = elements.generateIntakeBrief) {
  const request = buildTextGenerationRequest();
  const runBase = {
    packet: request.packet,
    claim: request.claim,
    workspace: request.workspace,
    storeQuestion: request.body.coreQuestion
  };

  pendingState.text = true;
  setButtonBusy(button, "Briefing...");
  setAppStatus("Generating intake brief...", "loading");
  renderAll();

  try {
    const payload = await requestJson("/api/generate-text", {
      method: "POST",
      body: JSON.stringify({
        ...request.body,
        taskType: "intake_brief",
        model: getAiSettings().textModel
      })
    });
    const intakeBrief = {
      ...payload.output,
      model: sanitizeLocalText(payload.model, 80),
      generatedAt: new Date().toISOString()
    };
    const recommendedPacketId = store.packets.some((candidate) => candidate.id === intakeBrief.recommendedPacketId)
      ? intakeBrief.recommendedPacketId
      : request.packet.id;

    await persistState({
      appPatch: { activePacketId: recommendedPacketId },
      packetId: recommendedPacketId,
      workspacePatch: {
        intakeBrief,
        selectedClaimIndex: recommendedPacketId === intakeBrief.recommendedPacketId
          ? intakeBrief.recommendedClaimIndex
          : request.workspace.selectedClaimIndex,
        generationRuns: withRunEntry(request.workspace, buildRunEntry("intake_brief", intakeBrief.model, request.packet.shortLabel))
      }
    }, "Generated intake brief", request.packet.label);
    pulseButtonDone(button, "Brief ready");
    flashFeedback("Intake brief generated.");
    setActiveStage("verify");
    setAppStatus("Intake brief generated.", "success", true);
  } catch (error) {
    if (useDemoTextFallback(error)) {
      const intakeBrief = buildDemoIntakeBrief(runBase);
      await persistState({
        packetId: request.packet.id,
        workspacePatch: {
          intakeBrief,
          selectedClaimIndex: request.workspace.selectedClaimIndex,
          generationRuns: withRunEntry(request.workspace, buildRunEntry("intake_brief", intakeBrief.model, request.packet.shortLabel))
        }
      }, "Generated intake brief", request.packet.label);
      pulseButtonDone(button, "Brief ready");
      setActiveStage("verify");
      setAppStatus("Demo intake brief generated locally.", "success", true);
    } else {
      clearButtonBusy(button);
      setAppStatus(error.message, "error");
    }
  } finally {
    pendingState.text = false;
    renderAll();
  }
}

async function generateClaimMap(button = elements.generateClaimMap) {
  const request = buildTextGenerationRequest();
  const runBase = {
    packet: request.packet,
    claim: request.claim,
    workspace: request.workspace
  };

  pendingState.text = true;
  setButtonBusy(button, "Mapping...");
  setAppStatus("Generating claim map...", "loading");
  renderAll();

  try {
    const payload = await requestJson("/api/generate-text", {
      method: "POST",
      body: JSON.stringify({
        ...request.body,
        taskType: "claim_map",
        model: getAiSettings().textModel
      })
    });
    const claimMap = {
      ...payload.output,
      model: sanitizeLocalText(payload.model, 80),
      generatedAt: new Date().toISOString()
    };

    await persistState({
      packetId: request.packet.id,
      workspacePatch: {
        claimMap,
        generationRuns: withRunEntry(request.workspace, buildRunEntry("claim_map", claimMap.model, request.claim.title))
      }
    }, "Generated claim map", request.claim.title);
    pulseButtonDone(button, "Map ready");
    flashFeedback("Claim map generated.");
    setAppStatus("Claim map generated.", "success", true);
  } catch (error) {
    if (useDemoTextFallback(error)) {
      const claimMap = buildDemoClaimMap(runBase);
      await persistState({
        packetId: request.packet.id,
        workspacePatch: {
          claimMap,
          generationRuns: withRunEntry(request.workspace, buildRunEntry("claim_map", claimMap.model, request.claim.title))
        }
      }, "Generated claim map", request.claim.title);
      pulseButtonDone(button, "Map ready");
      setAppStatus("Demo claim map generated locally.", "success", true);
    } else {
      clearButtonBusy(button);
      setAppStatus(error.message, "error");
    }
  } finally {
    pendingState.text = false;
    renderAll();
  }
}

async function generateAngleOptions(button = elements.generateAngleOptions) {
  const request = buildTextGenerationRequest();
  const runBase = {
    packet: request.packet,
    claim: request.claim,
    audience: request.audience
  };

  pendingState.text = true;
  setButtonBusy(button, "Thinking...");
  setAppStatus("Generating angle stack...", "loading");
  renderAll();

  try {
    const payload = await requestJson("/api/generate-text", {
      method: "POST",
      body: JSON.stringify({
        ...request.body,
        taskType: "angle_options",
        model: getAiSettings().textModel
      })
    });
    const angleOptions = Array.isArray(payload.output?.angles) ? payload.output.angles : [];
    await persistState({
      packetId: request.packet.id,
      workspacePatch: {
        angleOptions,
        selectedAngleIndex: 0,
        generationRuns: withRunEntry(request.workspace, buildRunEntry("angle_options", sanitizeLocalText(payload.model, 80), request.packet.shortLabel))
      }
    }, "Generated angle stack", request.packet.label);
    pulseButtonDone(button, "Angles ready");
    flashFeedback("Angle stack generated.");
    setAppStatus("Angle stack generated.", "success", true);
  } catch (error) {
    if (useDemoTextFallback(error)) {
      const angleOptions = buildDemoAngleOptions(runBase);
      await persistState({
        packetId: request.packet.id,
        workspacePatch: {
          angleOptions,
          selectedAngleIndex: 0,
          generationRuns: withRunEntry(request.workspace, buildRunEntry("angle_options", "puentes-demo", request.packet.shortLabel))
        }
      }, "Generated angle stack", request.packet.label);
      pulseButtonDone(button, "Angles ready");
      setAppStatus("Demo angle stack generated locally.", "success", true);
    } else {
      clearButtonBusy(button);
      setAppStatus(error.message, "error");
    }
  } finally {
    pendingState.text = false;
    renderAll();
  }
}

async function reviewDraftWithAi(button = elements.reviewDraft) {
  const packet = getPacket();
  const claim = getClaim();
  const workspace = getWorkspace();
  const bundle = getBundle();
  const aiSettings = getAiSettings();
  const requestBody = {
    audience: getAudience().id,
    format: workspace.selectedFormat,
    packetTitle: packet.label,
    packetSummary: packet.summary,
    claim: `${claim.title} ${claim.summary}`,
    citations: bundle.citations,
    manipulationSignals: [...packet.manipulation, ...claim.signals].slice(0, 5),
    model: aiSettings.reviewModel,
    draft: {
      title: bundle.title,
      hook: bundle.hook,
      caption: bundle.caption,
      script: bundle.script,
      slides: bundle.slides,
      commentPrompt: bundle.commentPrompt,
      shareSummary: bundle.shareSummary,
      note: bundle.note
    }
  };

  pendingState.text = true;
  setButtonBusy(button, "Reviewing...");
  setAppStatus("Running review copilot...", "loading");
  renderAll();

  try {
    const payload = await requestJson("/api/review-draft", {
      method: "POST",
      body: JSON.stringify(requestBody)
    });
    const reviewFindings = {
      ...payload.output,
      model: sanitizeLocalText(payload.model, 80),
      generatedAt: new Date().toISOString()
    };

    await persistState({
      packetId: packet.id,
      workspacePatch: {
        reviewFindings,
        generationRuns: withRunEntry(workspace, buildRunEntry("review_draft", reviewFindings.model, workspace.selectedFormat))
      }
    }, "Ran review copilot", `${packet.label} -> ${workspace.selectedFormat}`);
    pulseButtonDone(button, "Review ready");
    flashFeedback("Review findings generated.");
    setAppStatus("Review findings generated.", "success", true);
  } catch (error) {
    if (useDemoTextFallback(error)) {
      const reviewFindings = buildDemoReviewFindings({ packet, claim });
      await persistState({
        packetId: packet.id,
        workspacePatch: {
          reviewFindings,
          generationRuns: withRunEntry(workspace, buildRunEntry("review_draft", reviewFindings.model, workspace.selectedFormat))
        }
      }, "Ran review copilot", `${packet.label} -> ${workspace.selectedFormat}`);
      pulseButtonDone(button, "Review ready");
      setAppStatus("Demo review findings generated locally.", "success", true);
    } else {
      clearButtonBusy(button);
      setAppStatus(error.message, "error");
    }
  } finally {
    pendingState.text = false;
    renderAll();
  }
}

async function generateImageConcept(button = elements.generateImage) {
  const packet = getPacket();
  const workspace = getWorkspace();
  const packetMedia = ensurePacketMediaState(packet.id);
  const prompt = buildVisualPrompt();

  pendingState.image = true;
  setButtonBusy(button, "Generating...");
  packetMedia.imagesByFormat[workspace.selectedFormat] = {
    ...(packetMedia.imagesByFormat[workspace.selectedFormat] || {}),
    prompt,
    status: "loading"
  };
  saveMediaSnapshot();
  renderAll();
  setAppStatus("Generating cover visual...", "loading");

  try {
    const payload = await requestJson("/api/generate-image", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        size: "1536x1024",
        quality: "medium",
        outputFormat: "png",
        model: getAiSettings().imageModel
      })
    });

    packetMedia.imagesByFormat[workspace.selectedFormat] = {
      prompt,
      status: "ready",
      generatedAt: new Date().toISOString(),
      model: sanitizeLocalText(payload.model, 80),
      dataUrl: payload.image?.dataUrl || "",
      revisedPrompt: sanitizeLocalNote(payload.image?.revisedPrompt || "", 1200)
    };
    saveMediaSnapshot();
    await persistState({
      packetId: packet.id,
      workspacePatch: {
        generationRuns: withRunEntry(workspace, buildRunEntry("generate_image", sanitizeLocalText(payload.model, 80), workspace.selectedFormat))
      }
    }, "Generated visual concept", `${packet.label} -> ${workspace.selectedFormat}`);
    renderAll();
    pulseButtonDone(button, "Visual ready");
    setAppStatus("Visual concept generated.", "success", true);
    flashFeedback("Cover visual is ready.");
  } catch (error) {
    if (useDemoMediaFallback(error)) {
      packetMedia.imagesByFormat[workspace.selectedFormat] = buildDemoImageAsset({
        packet,
        audience: getAudience(),
        claim: getClaim(),
        workspace
      });
      saveMediaSnapshot();
      await persistState({
        packetId: packet.id,
        workspacePatch: {
          generationRuns: withRunEntry(workspace, buildRunEntry("generate_image", "puentes-demo", workspace.selectedFormat))
        }
      }, "Generated visual concept", `${packet.label} -> ${workspace.selectedFormat}`);
      renderAll();
      pulseButtonDone(button, "Visual ready");
      setAppStatus("Demo visual generated locally.", "success", true);
      flashFeedback("Demo visual is ready.");
    } else {
      clearButtonBusy(button);
      packetMedia.imagesByFormat[workspace.selectedFormat] = {
        prompt,
        status: "error",
        error: error.message,
        generatedAt: new Date().toISOString()
      };
      saveMediaSnapshot();
      renderAll();
      setAppStatus(error.message, "error");
    }
  } finally {
    pendingState.image = false;
    renderAll();
  }
}

async function generateVideoConcept(button = elements.generateVideo) {
  const packet = getPacket();
  const workspace = getWorkspace();
  const packetMedia = ensurePacketMediaState(packet.id);
  const prompt = buildVideoPrompt();

  pendingState.video = true;
  setButtonBusy(button, "Starting...");
  packetMedia.videosByFormat[workspace.selectedFormat] = {
    ...(packetMedia.videosByFormat[workspace.selectedFormat] || {}),
    prompt,
    status: "queued"
  };
  saveMediaSnapshot();
  renderAll();
  setAppStatus("Starting short video generation...", "loading");

  try {
    const payload = await requestJson("/api/generate-video", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        size: "1280x720",
        seconds: 8,
        model: getAiSettings().videoModel
      })
    });

    packetMedia.videosByFormat[workspace.selectedFormat] = {
      prompt,
      status: payload.video?.status || "processing",
      id: sanitizeLocalText(payload.video?.id, 120),
      model: sanitizeLocalText(payload.model, 80),
      createdAt: new Date().toISOString(),
      download: {
        video: payload.downloadUrl || "",
        thumbnail: payload.thumbnailUrl || ""
      }
    };
    saveMediaSnapshot();
    await persistState({
      packetId: packet.id,
      workspacePatch: {
        generationRuns: withRunEntry(workspace, buildRunEntry("generate_video", sanitizeLocalText(payload.model, 80), workspace.selectedFormat, "queued"))
      }
    }, "Queued short video", `${packet.label} -> ${workspace.selectedFormat}`);
    renderAll();
    pulseButtonDone(button, "Job started");
    setAppStatus("Video job started. Puentes will keep checking status.", "success", true);
    scheduleVideoPoll(packet.id, workspace.selectedFormat, 4000);
  } catch (error) {
    if (useDemoMediaFallback(error)) {
      packetMedia.videosByFormat[workspace.selectedFormat] = buildDemoVideoAsset({
        packet,
        audience: getAudience(),
        claim: getClaim(),
        workspace
      });
      saveMediaSnapshot();
      await persistState({
        packetId: packet.id,
        workspacePatch: {
          generationRuns: withRunEntry(workspace, buildRunEntry("generate_video", "puentes-demo", workspace.selectedFormat, "ready"))
        }
      }, "Queued short video", `${packet.label} -> ${workspace.selectedFormat}`);
      renderAll();
      pulseButtonDone(button, "Queued");
      setAppStatus("Demo video concept started locally.", "success", true);
      flashFeedback("Demo video concept is rendering.");
      scheduleDemoVideoReady(packet.id, workspace.selectedFormat);
    } else {
      clearButtonBusy(button);
      packetMedia.videosByFormat[workspace.selectedFormat] = {
        prompt,
        status: "error",
        error: error.message,
        createdAt: new Date().toISOString()
      };
      saveMediaSnapshot();
      renderAll();
      setAppStatus(error.message, "error");
    }
  } finally {
    pendingState.video = false;
    renderAll();
  }
}

async function resetGeneratedDraft() {
  const packet = getPacket();
  const workspace = getWorkspace();
  const format = workspace.selectedFormat;
  const generatedBundlesByFormat = { ...(workspace.generatedBundlesByFormat || {}) };
  const packetMedia = ensurePacketMediaState(packet.id);

  delete generatedBundlesByFormat[format];
  delete packetMedia.imagesByFormat[format];
  delete packetMedia.videosByFormat[format];
  clearVideoPoll(packet.id, format);
  saveMediaSnapshot();

  await persistState(
    {
      packetId: packet.id,
      workspacePatch: {
        generatedBundlesByFormat,
        reviewStatus: "pending",
        shareReady: false,
        shareUrl: ""
      }
    },
    "Reset AI draft",
    `${packet.label} -> ${format}`
  );

  flashFeedback("Returned to the packet default.");
}

function nextAudienceId(currentAudienceId) {
  const currentIndex = store.audiences.findIndex((audience) => audience.id === currentAudienceId);
  const nextIndex = (currentIndex + 1) % store.audiences.length;
  return store.audiences[nextIndex].id;
}

async function markExportAction(action, detail, extraPatch = {}) {
  const workspace = getWorkspace();
  const format = workspace.selectedFormat;
  const exportedFormats = [...new Set([...(workspace.exportedFormats || []), format])];

  await persistState(
    {
      packetId: getPacket().id,
      workspacePatch: {
        ...extraPatch,
        exportedFormats
      }
    },
    action,
    detail
  );
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    const packet = getPacket();
    const workspace = getWorkspace();
    const stageTrigger = event.target.closest("[data-stage-trigger]");

    if (stageTrigger) {
      setActiveStage(stageTrigger.dataset.stageTrigger);
      return;
    }

    const audienceButton = event.target.closest("[data-audience-id]");
    if (audienceButton) {
      if (readonlyMode) {
        return;
      }

      const audience = store.audiences.find((item) => item.id === audienceButton.dataset.audienceId);
      if (!audience || audience.id === workspace.selectedAudienceId) {
        return;
      }

      try {
        setAppStatus("Switching audience mode...", "loading");
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: {
              selectedAudienceId: audience.id,
              selectedFormat: audience.defaultFormat,
              reviewStatus: "pending"
            }
          },
          "Switched audience",
          `${packet.label} -> ${audience.label} mode`
        );
        setAppStatus("Audience updated.", "success", true);
        setActiveStage("verify");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    const packetButton = event.target.closest("[data-packet-id]");
    if (packetButton) {
      if (readonlyMode) {
        return;
      }

      const nextPacket = store.packets.find((item) => item.id === packetButton.dataset.packetId);
      if (!nextPacket || nextPacket.id === packet.id) {
        return;
      }

      try {
        setAppStatus("Opening packet...", "loading");
        await persistState(
          {
            appPatch: { activePacketId: nextPacket.id },
            packetId: nextPacket.id
          },
          "Opened packet",
          nextPacket.label
        );
        setAppStatus("Packet loaded.", "success", true);
        setActiveStage("verify");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    const claimButton = event.target.closest("[data-claim-index]");
    if (claimButton) {
      if (readonlyMode) {
        return;
      }

      const selectedClaimIndex = Number(claimButton.dataset.claimIndex);
      const claim = packet.claims[selectedClaimIndex];
      if (!claim) {
        return;
      }

      try {
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: {
              selectedClaimIndex,
              reviewStatus: "pending"
            }
          },
          "Opened claim",
          claim.title
        );
        setActiveStage("draft");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    const formatButton = event.target.closest("[data-format]");
    if (formatButton) {
      if (readonlyMode) {
        return;
      }

      try {
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: {
              selectedFormat: formatButton.dataset.format
            }
          },
          "Switched output",
          formatButton.textContent.trim()
        );
        setActiveStage("draft");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    const packagingButton = event.target.closest("[data-packaging-preset]");
    if (packagingButton) {
      if (readonlyMode) {
        return;
      }

      try {
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: {
              packagingPreset: packagingButton.dataset.packagingPreset
            }
          },
          "Updated packaging mode",
          packagingButton.textContent.trim()
        );
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    const angleButton = event.target.closest("[data-angle-index]");
    if (angleButton) {
      if (readonlyMode) {
        return;
      }

      try {
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: {
              selectedAngleIndex: Number(angleButton.dataset.angleIndex)
            }
          },
          "Selected angle",
          angleButton.textContent.trim().slice(0, 80)
        );
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "generate-text") {
      if (readonlyMode) {
        return;
      }

      await generateTextDraft(elements.generateText);
      return;
    }

    if (event.target.id === "generate-intake-brief") {
      if (readonlyMode) {
        return;
      }

      await generateIntakeBrief(elements.generateIntakeBrief);
      return;
    }

    if (event.target.id === "generate-claim-map") {
      if (readonlyMode) {
        return;
      }

      await generateClaimMap(elements.generateClaimMap);
      return;
    }

    if (event.target.id === "generate-angle-options") {
      if (readonlyMode) {
        return;
      }

      await generateAngleOptions(elements.generateAngleOptions);
      return;
    }

    if (event.target.id === "review-draft") {
      if (readonlyMode) {
        return;
      }

      await reviewDraftWithAi(elements.reviewDraft);
      return;
    }

    if (event.target.id === "refine-hook") {
      if (readonlyMode) {
        return;
      }

      await refineTextDraft("hook", elements.refineHook);
      return;
    }

    if (event.target.id === "refine-caption") {
      if (readonlyMode) {
        return;
      }

      await refineTextDraft("caption", elements.refineCaption);
      return;
    }

    if (event.target.id === "refine-receipts") {
      if (readonlyMode) {
        return;
      }

      await refineTextDraft("receipts", elements.refineReceipts);
      return;
    }

    if (event.target.id === "refine-uncertainty") {
      if (readonlyMode) {
        return;
      }

      await refineTextDraft("uncertainty", elements.refineUncertainty);
      return;
    }

    if (event.target.id === "generate-image") {
      if (readonlyMode) {
        return;
      }

      await generateImageConcept(elements.generateImage);
      return;
    }

    if (event.target.id === "generate-video") {
      if (readonlyMode) {
        return;
      }

      await generateVideoConcept(elements.generateVideo);
      return;
    }

    if (event.target.id === "refresh-video") {
      await refreshVideoStatus();
      return;
    }

    if (event.target.id === "download-image") {
      const packetImage = getImageAsset();
      if (!packetImage?.dataUrl) {
        flashFeedback("Generate a visual first.", "error");
        return;
      }

      triggerDownload(packetImage.dataUrl, `puentes-${packet.id}-${workspace.selectedFormat}-visual.png`);
      flashFeedback("Visual download started.");
      return;
    }

    if (event.target.id === "download-video") {
      const packetVideo = getVideoAsset();
      if (!videoIsReady(packetVideo) || !packetVideo?.download?.video) {
        flashFeedback("Video is not ready yet.", "error");
        return;
      }

      triggerDownload(packetVideo.download.video, `puentes-${packet.id}-${workspace.selectedFormat}-video.mp4`);
      flashFeedback("Video download started.");
      return;
    }

    if (event.target.id === "reset-generated") {
      if (readonlyMode) {
        return;
      }

      try {
        await resetGeneratedDraft();
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "queue-question") {
      if (readonlyMode) {
        return;
      }

      const question = elements.questionInput.value.trim();
      if (!question) {
        flashFeedback("Add a real question first.", "error");
        return;
      }

      try {
        setAppStatus("Adding question to the queue...", "loading");
        await queueQuestion(question);
        elements.questionInput.value = "";
        setAppStatus("Question added to the queue.", "success", true);
        setActiveStage("verify");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "load-next-packet") {
      if (readonlyMode) {
        return;
      }

      const currentIndex = store.packets.findIndex((candidate) => candidate.id === packet.id);
      const nextPacket = store.packets[(currentIndex + 1) % store.packets.length];

      try {
        await persistState(
          {
            appPatch: { activePacketId: nextPacket.id },
            packetId: nextPacket.id
          },
          "Opened packet",
          nextPacket.label
        );
        setActiveStage("verify");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "save-note") {
      if (readonlyMode) {
        return;
      }

      try {
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: { reviewerNotes: elements.reviewerNotes.value.trim() }
          },
          "Saved reviewer note",
          elements.reviewerNotes.value.trim() || "Cleared note text"
        );
        flashFeedback("Reviewer note saved.");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "clear-note") {
      if (readonlyMode) {
        return;
      }

      elements.reviewerNotes.value = "";

      try {
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: { reviewerNotes: "" }
          },
          "Cleared reviewer note",
          packet.label
        );
        flashFeedback("Reviewer note cleared.");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "approve-review") {
      if (readonlyMode) {
        return;
      }

      if (!allChecklistDone(workspace)) {
        flashFeedback("Finish the checklist before approval.", "error");
        return;
      }

      try {
        const shareUrl = getShareUrl(packet.id);
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: {
              reviewStatus: "approved",
              shareReady: true,
              shareUrl
            }
          },
          "Approved handoff",
          packet.label
        );
        flashFeedback("Export package unlocked.");
        setActiveStage("export");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "request-revision") {
      if (readonlyMode) {
        return;
      }

      try {
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: { reviewStatus: "revision" }
          },
          "Requested revision",
          packet.label
        );
        flashFeedback("Packet marked for revision.");
        setActiveStage("verify");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "copy-output") {
      if (workspace.reviewStatus !== "approved") {
        flashFeedback("Approval unlocks export actions.", "error");
        return;
      }

      try {
        await copyText(buildExportText());
        await markExportAction("Copied output", `${packet.label} -> ${workspace.selectedFormat}`);
        pulseButtonDone(elements.copyOutput, "Copied");
        flashFeedback("Handoff copied to clipboard.");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "download-output") {
      if (workspace.reviewStatus !== "approved") {
        flashFeedback("Approval unlocks export actions.", "error");
        return;
      }

      try {
        downloadText(`puentes-${packet.id}-${workspace.selectedFormat}.txt`, buildExportText());
        await markExportAction("Downloaded handoff", `${packet.label} -> ${workspace.selectedFormat}`);
        pulseButtonDone(elements.downloadOutput, "Downloaded");
        flashFeedback("Handoff downloaded.");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "copy-share-link") {
      if (workspace.reviewStatus !== "approved") {
        flashFeedback("Approval unlocks share links.", "error");
        return;
      }

      try {
        const shareUrl = getShareUrl(packet.id);
        await copyText(shareUrl);
        await markExportAction("Copied share link", packet.label, { shareReady: true, shareUrl });
        pulseButtonDone(elements.copyShareLink, "Copied");
        flashFeedback("Share link copied.");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "open-share-preview") {
      if (workspace.reviewStatus !== "approved") {
        flashFeedback("Approval unlocks share previews.", "error");
        return;
      }

      try {
        const shareUrl = getShareUrl(packet.id);
        window.open(shareUrl, "_blank", "noopener");
        await markExportAction("Opened share preview", packet.label, { shareReady: true, shareUrl });
        pulseButtonDone(elements.openSharePreview, "Opened");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    if (event.target.id === "duplicate-audience") {
      if (readonlyMode) {
        return;
      }

      const nextId = nextAudienceId(workspace.selectedAudienceId);
      const nextAudience = store.audiences.find((audience) => audience.id === nextId);

      try {
        await persistState(
          {
            packetId: packet.id,
            workspacePatch: {
              selectedAudienceId: nextAudience.id,
              selectedFormat: nextAudience.defaultFormat,
              reviewStatus: "pending"
            }
          },
          "Remixed audience",
          `${packet.label} -> ${nextAudience.label}`
        );
        pulseButtonDone(elements.duplicateAudience, "Remixed");
        flashFeedback(`Remixed for ${nextAudience.label.toLowerCase()} mode.`);
        setActiveStage("draft");
      } catch (error) {
        setAppStatus(error.message, "error");
      }
    }
  });

  document.addEventListener("change", async (event) => {
    if (["text-model-select", "review-model-select", "image-model-select", "video-model-select"].includes(event.target.id)) {
      if (readonlyMode) {
        return;
      }

      try {
        await persistState({
          packetId: getPacket().id,
          workspacePatch: {
            aiSettings: {
              ...getAiSettings(),
              textModel: elements.textModelSelect.value,
              reviewModel: elements.reviewModelSelect.value,
              imageModel: elements.imageModelSelect.value,
              videoModel: elements.videoModelSelect.value
            }
          }
        }, "Updated model desk", getPacket().label);
      } catch (error) {
        setAppStatus(error.message, "error");
      }
      return;
    }

    const checkbox = event.target.closest("[data-check-id]");
    if (!checkbox || readonlyMode) {
      return;
    }

    const workspace = getWorkspace();
    const nextChecklist = workspace.checklist.map((item) => (
      item.id === checkbox.dataset.checkId
        ? { ...item, done: checkbox.checked }
        : item
    ));

    try {
      await persistState(
        {
          packetId: getPacket().id,
          workspacePatch: {
            checklist: nextChecklist,
            reviewStatus: "pending"
          }
        },
        checkbox.checked ? "Completed checklist item" : "Unchecked checklist item",
        nextChecklist.find((item) => item.id === checkbox.dataset.checkId)?.label || "Checklist item"
      );
    } catch (error) {
      setAppStatus(error.message, "error");
    }
  });
}

async function init() {
  prepareSmokeModeState();
  cacheElements();
  hydrateMediaSnapshot(loadMediaSnapshot());
  bindEvents();
  setAppStatus("Loading creator workflow...", "loading");

  try {
    await bootstrap();
    if (readonlyMode) {
      setAppStatus("Read-only creator handoff preview loaded.", "success", true);
    } else if (persistenceMode === "local") {
      setAppStatus("Running in local demo mode. Edits are saved in this browser.", "loading");
    } else {
      setAppStatus();
    }

    if (!readonlyMode && demoSmokeEnabled()) {
      await runSmokeDemoFlow();
    }
  } catch (error) {
    setAppStatus("The workspace failed to load. Refresh and try again.", "error");
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", init);
