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

function cacheElements() {
  Object.assign(elements, {
    saveStatus: document.getElementById("save-status"),
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
    detectorVerdict: document.getElementById("detector-verdict"),
    detectorConfidence: document.getElementById("detector-confidence"),
    detectorRisk: document.getElementById("detector-risk"),
    detectorContext: document.getElementById("detector-context"),
    detectorPatterns: document.getElementById("detector-patterns"),
    detectorViewerThinks: document.getElementById("detector-viewer-thinks"),
    detectorRecordSays: document.getElementById("detector-record-says"),
    detectorSpreadBar: document.getElementById("detector-spread-bar"),
    detectorEvidenceBar: document.getElementById("detector-evidence-bar"),
    detectorSpreadScore: document.getElementById("detector-spread-score"),
    detectorEvidenceScore: document.getElementById("detector-evidence-score"),
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
    responseColdOpen: document.getElementById("response-cold-open"),
    responseOnscreen: document.getElementById("response-onscreen"),
    responsePinned: document.getElementById("response-pinned"),
    responseStitch: document.getElementById("response-stitch"),
    responseCta: document.getElementById("response-cta"),
    aiStatusPill: document.getElementById("ai-status-pill"),
    generateText: document.getElementById("generate-text"),
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
    exportAvoidLine: document.getElementById("export-avoid-line"),
    exportModerationNote: document.getElementById("export-moderation-note"),
    exportReceiptsLine: document.getElementById("export-receipts-line"),
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

function getFeedSignals(packetId = getPacket()?.id) {
  const packet = getPacket(packetId);
  const feed = packet?.feed || {};

  return {
    platform: sanitizeLocalText(feed.platform || "TikTok / Reels / Shorts", 80),
    spreadPattern: sanitizeLocalText(feed.spreadPattern || "Short-form feed clip", 160),
    detectorLabel: sanitizeLocalText(feed.detectorLabel || "High misinformation risk", 120),
    spreadHeat: sanitizeLocalText(feed.spreadHeat || "medium", 40),
    correctionMode: sanitizeLocalText(feed.correctionMode || "Myth-check video", 120),
    trendTags: Array.isArray(feed.trendTags) ? sanitizeList(feed.trendTags, 5, 60) : [],
    hookSeed: sanitizeLocalText(feed.hookSeed || packet?.question || "", 180)
  };
}

function getClaimDetector(packetId = getPacket()?.id) {
  const claim = getClaim(packetId);
  const detector = claim?.detector || {};
  const status = claim?.status || "unclear";
  const defaultConfidence = status === "supported" ? "High confidence" : status === "mixed" ? "Medium confidence" : "Low confidence";
  const defaultRisk = status === "supported" ? "Moderate risk of simplification" : "High risk of false certainty";
  const defaultContext = claim?.gap || "Context is incomplete and should stay visible.";
  const defaultPatterns = sanitizeList(claim?.signals || [], 4, 120);

  return {
    confidenceBand: sanitizeLocalText(detector.confidenceBand || defaultConfidence, 80),
    riskToAudience: sanitizeLocalText(detector.riskToAudience || defaultRisk, 120),
    missingContextType: sanitizeLocalText(detector.missingContextType || defaultContext, 180),
    deceptionPatterns: Array.isArray(detector.deceptionPatterns)
      ? sanitizeList(detector.deceptionPatterns, 5, 120)
      : defaultPatterns,
    viewerBelief: sanitizeLocalText(detector.viewerBelief || claim?.title || "", 180),
    recordSays: sanitizeLocalText(detector.recordSays || claim?.summary || "", 220),
    spreadScore: Math.max(0, Math.min(Number(detector.spreadScore) || 72, 100)),
    evidenceScore: Math.max(0, Math.min(Number(detector.evidenceScore) || (status === "supported" ? 88 : status === "mixed" ? 63 : 46), 100)),
    responseMode: sanitizeLocalText(detector.responseMode || getFeedSignals(packetId).correctionMode, 120)
  };
}

function formatFeedReadout(feed = getFeedSignals()) {
  const parts = [
    feed.platform,
    feed.spreadPattern,
    feed.detectorLabel
  ].filter(Boolean);

  return parts.join(" | ");
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

function sanitizeList(items, maxItems = 6, maxLength = 240) {
  return Array.isArray(items)
    ? items.map((item) => sanitizeLocalText(item, maxLength)).filter(Boolean).slice(0, maxItems)
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
  const feed = getFeedSignals(packet.id);
  return [
    ...sanitizeList(claim?.signals, 2, 220),
    sanitizeLocalText(claim?.gap || "", 220),
    sanitizeLocalText(packet?.amplification || "", 220),
    sanitizeLocalText(audience?.draftRule || "", 220),
    sanitizeLocalText(feed.detectorLabel || "", 220)
  ].filter(Boolean).slice(0, 5);
}

function buildVisualPrompt(bundle = getBundle(), packet = getPacket(), audience = getAudience(), claim = getClaim()) {
  const feed = getFeedSignals(packet.id);
  if (bundle?.visualBrief) {
    return bundle.visualBrief;
  }

  return [
    `Create a bold civic explainer cover image for ${packet.label} that works as a TikTok-first thumbnail.`,
    `Audience: ${audience.label}.`,
    `Hook: ${bundle.hook}.`,
    `Claim focus: ${claim.title}.`,
    `Feed hook seed: ${feed.hookSeed}.`,
    `Feed pattern: ${feed.spreadPattern}.`,
    "Use editorial composition, confident typography space, and a trustworthy, youth-native tone.",
    "The image should interrupt a feed scroll, feel stitch-worthy, and avoid panic bait.",
    "No fearmongering, no partisan logos, no sensational disaster imagery."
  ].join(" ");
}

function buildVideoPrompt(bundle = getBundle(), packet = getPacket(), audience = getAudience(), claim = getClaim()) {
  const feed = getFeedSignals(packet.id);
  if (bundle?.videoBrief) {
    return bundle.videoBrief;
  }

  return [
    `Create an 8-second vertical-first civic explainer clip for ${packet.label}.`,
    `Audience: ${audience.label}.`,
    `Feed hook seed: ${feed.hookSeed}.`,
    `Open with this hook: ${bundle.hook}.`,
    `Keep the focus on: ${claim.title}.`,
    `Feed pattern to interrupt: ${feed.spreadPattern}.`,
    `Correction mode: ${feed.correctionMode}.`,
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
  const feed = getFeedSignals(packet.id);
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
    bundle.shareSummary = shortSentence(`${packet.shortLabel}: what changed, what stayed, and what still needs watching. ${feed.correctionMode}.`, 200);
    bundle.safetyNotes = sanitizeList([...baseSafetyNotes, unresolvedLine], 5, 220);
  } else {
    bundle.title = shortSentence(`${packet.label}: what changed, what stayed, and what still needs context`, 180);
    bundle.hook = shortSentence(`Quick reset: ${claim.title.replace(/\.$/, "")} is not the whole story. Here is the cleaner version.`, 220);
    bundle.caption = trimCaption(`${bundle.hook} ${shortSentence(claim.summary, 150)} What changed, what stayed, and what still needs watching are all in the handoff. ${feed.correctionMode}.`, 340);
    bundle.script = sanitizeLocalNote(`${bundle.hook}\n\n${shortSentence(claim.evidence, 260)}\n\nWhat is still open: ${unresolvedLine}\n\nThis is packaged for ${feed.correctionMode.toLowerCase()} against ${feed.spreadPattern}.\n\nSources stay attached so people can check the record themselves.`, 1600);
    bundle.slides = sanitizeList([
      `What people are saying: ${claim.title}`,
      `What the packet supports: ${shortSentence(claim.evidence, 120)}`,
      `What is still open: ${unresolvedLine}`,
      "Why this can travel: the receipts stay attached."
    ], 6, 220);
    bundle.commentPrompt = shortSentence(`What part of this issue gets distorted fastest once it hits the feed?`, 180);
    bundle.shareSummary = shortSentence(`${packet.shortLabel}: a source-linked explainer for ${audience.label.toLowerCase()} mode. ${feed.detectorLabel}.`, 180);
  }

  return bundle;
}

function buildDemoImageAsset(context) {
  const bundle = getBundle();
  const feed = getFeedSignals(context.packet.id);
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
  <text x="108" y="470" fill="#ffcfb8" font-family="Arial, sans-serif" font-size="24">Detector read: ${escapeHtml(feed.detectorLabel)}</text>
  <text x="108" y="508" fill="#ffcfb8" font-family="Arial, sans-serif" font-size="24">Feed pattern: ${escapeHtml(feed.spreadPattern)}</text>
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
  const feed = getFeedSignals(context.packet.id);
  return {
    prompt: buildVideoPrompt(),
    status: "processing",
    id: `demo-video-${Date.now()}`,
    model: "puentes-demo",
    createdAt: new Date().toISOString(),
    demo: true,
    demoTitle: shortSentence(bundle.hook, 120),
    demoSummary: shortSentence(`8-second explainer concept for ${context.packet.shortLabel}. ${feed.correctionMode}. Text first, motion second.`, 180)
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
    shareUrl: sanitizeLocalText(candidate.shareUrl ?? defaults.shareUrl ?? "", 320)
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

function watchlistMarkup(question, index) {
  const packet = store.packets[index % store.packets.length] || getPacket();
  const feed = getFeedSignals(packet?.id);
  return `
    <li class="watchlist-card">
      <strong>${escapeHtml(question)}</strong>
      <span>${escapeHtml(`${packet?.shortLabel || "Packet"} | ${feed.platform}`)}</span>
      <span class="history-meta">${escapeHtml(`${feed.detectorLabel} | ${feed.spreadHeat} heat | ${feed.correctionMode}`)}</span>
    </li>
  `;
}

function historyMarkup(entry) {
  return `
    <li>
      <strong>${escapeHtml(entry.action)}</strong>
      <span>${escapeHtml(entry.detail || "")}</span>
      <span class="history-meta">${escapeHtml(new Date(entry.timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }))}</span>
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
  const detector = getClaimDetector(packet.id);
  const imageAsset = getImageAsset();
  const videoAsset = getVideoAsset();
  const feed = getFeedSignals(packet.id);

  return [
    "Puentes creator handoff",
    "",
    `Packet: ${packet.label}`,
    `Audience: ${audience.label}`,
    `Format: ${bundle.label}`,
    `Review status: ${workspace.reviewStatus}`,
    `Feed platform: ${feed.platform}`,
    `Spread heat: ${feed.spreadHeat}`,
    `Detector read: ${feed.detectorLabel}`,
    `Confidence band: ${detector.confidenceBand}`,
    `Response lane: ${detector.responseMode}`,
    "",
    "Title",
    bundle.title,
    "",
    "Hook",
    bundle.hook,
    "",
    "Caption",
    bundle.caption,
    "",
    "Script / talking path",
    bundle.script,
    "",
    "Slides / beats",
    ...bundle.slides.map((slide, index) => `${index + 1}. ${slide}`),
    "",
    "Comment prompt",
    bundle.commentPrompt,
    "",
    "Detector read",
    `Risk pattern: ${feed.detectorLabel}`,
    `Spread shape: ${feed.spreadPattern}`,
    `Correction mode: ${feed.correctionMode}`,
    `Open with: ${feed.hookSeed}`,
    ...(feed.trendTags.length ? [`Trend tags: ${feed.trendTags.join(", ")}`] : []),
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
    "Detector board",
    `Audience risk: ${detector.riskToAudience}`,
    `Missing context: ${detector.missingContextType}`,
    `Spread score: ${detector.spreadScore}/100`,
    `Evidence score: ${detector.evidenceScore}/100`,
    `Viewer belief: ${detector.viewerBelief}`,
    `Record says: ${detector.recordSays}`,
    ...detector.deceptionPatterns.map((item) => `Pattern: ${item}`),
    "",
    "Creator response kit",
    `Cold open: ${feed.hookSeed || bundle.hook}`,
    `On-screen receipt: ${claim.citations[0] || bundle.citations[0] || "Keep a source line visible."}`,
    `Pinned comment: ${bundle.commentPrompt} Sources in caption.`,
    `Stitch-safe line: ${detector.responseMode} with the missing context first.`,
    "",
    "Citations",
    ...bundle.citations.map((citation) => `- ${citation}`),
    "",
    "Reviewer notes",
    workspace.reviewerNotes || "No reviewer note added.",
    "",
    "Safety notes",
    ...(bundle.safetyNotes?.length ? bundle.safetyNotes : buildFallbackSafetyNotes(packet, claim, audience)),
    "",
    "Share summary",
    bundle.shareSummary,
    "",
    "Generated media",
    imageAsset?.dataUrl ? "Cover visual ready" : "No generated visual saved",
    videoAsset?.id ? `Video status: ${readableVideoStatus(videoAsset.status)}` : "No generated video job"
  ].join("\n");
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

function renderHero() {
  const packet = getPacket();
  const audience = getAudience();
  const bundle = getBundle();
  const queue = store.workspace?.queue || [];
  const claim = getClaim();
  const feed = getFeedSignals(packet.id);

  elements.heroQuestion.textContent = queue[0] || packet.question;
  elements.heroBefore.textContent = packet.summary;
  elements.heroAfter.textContent = bundle.caption;
  elements.heroOutputLabel.textContent = `${bundle.label} ready for ${audience.label.toLowerCase()} mode | ${feed.spreadHeat} spread heat`;
  elements.visualPacket.textContent = `${packet.shortLabel} / ${feed.platform}`;
  elements.visualClaim.textContent = `${claim.title} / ${feed.detectorLabel}`;
  elements.visualShareSummary.textContent = `${bundle.shareSummary} / ${feed.correctionMode}`;
  elements.visualHook.textContent = bundle.hook;
  elements.visualSlides.innerHTML = createListMarkup(bundle.slides.slice(0, 3));
  elements.visualComment.textContent = bundle.commentPrompt;
  elements.visualSource.textContent = `${formatFeedReadout(feed)} | ${feed.trendTags.slice(0, 2).join(" / ") || packet.sources.slice(0, 2).join(" / ")}`;
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
  elements.queueList.innerHTML = queue.length
    ? queue.map(watchlistMarkup).join("")
    : `<li class="empty-state">Add a real creator question and it will appear here.</li>`;
}

function renderPackets() {
  elements.packetList.innerHTML = store.packets.map(packetTabMarkup).join("");
  elements.packetCount.textContent = `${store.packets.length} packets`;
}

function renderPacketDetail() {
  const packet = getPacket();
  const feed = getFeedSignals(packet.id);

  elements.packetType.textContent = `${packet.type} / ${feed.platform}`;
  elements.packetType.dataset.status = "packet";
  elements.packetDate.textContent = `${packet.date} / ${feed.spreadHeat.toUpperCase()} heat`;
  elements.packetTrust.textContent = `${packet.trust} / ${feed.detectorLabel}`;
  elements.packetTitle.textContent = packet.label;
  elements.packetSummary.textContent = `${packet.summary} Detector read: ${feed.detectorLabel}.`;
  elements.packetQuestion.textContent = `${packet.question} Best correction: ${feed.correctionMode}.`;
  elements.packetSources.innerHTML = createListMarkup([
    ...packet.sources,
    ...feed.trendTags.map((tag) => `Trend tag: ${tag}`)
  ]);
}

function renderClaims() {
  const packet = getPacket();
  elements.claimList.innerHTML = packet.claims.map((claim, index) => claimTabMarkup(claim, index, packet.id)).join("");
  elements.claimCount.textContent = `${packet.claims.length} claims`;
}

function renderClaimDetail() {
  const claim = getClaim();
  const feed = getFeedSignals();

  elements.claimTitle.textContent = claim.title;
  elements.claimStatus.textContent = claimStatusText(claim.status);
  elements.claimStatus.dataset.status = claim.status;
  elements.claimSummary.textContent = `${claim.summary} TikTok read: ${feed.detectorLabel}.`;
  elements.claimEvidence.textContent = `${claim.evidence} Correction mode: ${feed.correctionMode}.`;
  elements.claimGap.textContent = `${claim.gap} Spread pattern: ${feed.spreadPattern}.`;
  elements.claimCitations.innerHTML = createListMarkup(claim.citations);
  elements.claimSignals.innerHTML = createListMarkup([
    ...claim.signals,
    `Feed risk: ${feed.detectorLabel}`,
    `Correction format: ${feed.correctionMode}`
  ]);
}

function renderClaimDetector() {
  const detector = getClaimDetector();
  const feed = getFeedSignals();

  setPillState(elements.detectorVerdict, feed.detectorLabel, "is-busy");
  elements.detectorConfidence.textContent = detector.confidenceBand;
  elements.detectorRisk.textContent = detector.riskToAudience;
  elements.detectorContext.textContent = detector.missingContextType;
  elements.detectorPatterns.innerHTML = createListMarkup(detector.deceptionPatterns, "No deception patterns logged.");
  elements.detectorViewerThinks.textContent = detector.viewerBelief;
  elements.detectorRecordSays.textContent = detector.recordSays;
  elements.detectorSpreadBar.style.width = `${detector.spreadScore}%`;
  elements.detectorEvidenceBar.style.width = `${detector.evidenceScore}%`;
  elements.detectorSpreadScore.textContent = `${detector.spreadScore}/100`;
  elements.detectorEvidenceScore.textContent = `${detector.evidenceScore}/100`;
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
  const feed = getFeedSignals();

  elements.draftKicker.textContent = generatedBundle
    ? `${bundle.label} / AI-assisted ${audience.label.toLowerCase()} mode`
    : `${bundle.label} / ${audience.label} mode`;
  elements.draftTitle.textContent = bundle.title;
  elements.draftSummary.textContent = generatedBundle
    ? `Fresh AI pass built from the current packet, claim, and audience framing. Feed lens: ${feed.detectorLabel}. Best correction: ${feed.correctionMode}. ${audience.draftRule}`
    : `${draft.summary} Feed lens: ${feed.detectorLabel}. ${audience.draftRule}`;
  elements.draftHook.textContent = bundle.hook;
  elements.draftCaption.textContent = bundle.caption;
  elements.draftScript.textContent = bundle.script;
  elements.draftCommentPrompt.textContent = bundle.commentPrompt;
  elements.draftSlides.innerHTML = createListMarkup(bundle.slides);
  elements.draftCitations.innerHTML = createListMarkup(bundle.citations);
  elements.draftShareSummary.textContent = `${bundle.shareSummary} / ${feed.spreadPattern}`;
  elements.draftNote.textContent = `${bundle.note} Feed response: ${feed.correctionMode}.`;
}

function renderResponseKit() {
  const packet = getPacket();
  const claim = getClaim();
  const audience = getAudience();
  const bundle = getBundle();
  const feed = getFeedSignals(packet.id);
  const detector = getClaimDetector(packet.id);

  elements.responseColdOpen.textContent = feed.hookSeed || bundle.hook;
  elements.responseOnscreen.textContent = claim.citations[0] || bundle.citations[0] || "Keep one visible receipt on screen.";
  elements.responsePinned.textContent = `${bundle.commentPrompt} Sources are in the caption and first comment.`;
  elements.responseStitch.textContent = `If you stitch this, open with the missing context: ${detector.missingContextType}`;
  elements.responseCta.textContent = audience.id === "educator"
    ? "Invite viewers to compare the record, the rumor, and what is still unresolved."
    : "Ask viewers which part of the claim changed once they saw the full record.";
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
  const feed = getFeedSignals(packet.id);
  const detector = getClaimDetector(packet.id);
  const claim = getClaim(packet.id);
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
    ? `${bundle.label} is ready for ${audience.label.toLowerCase()} mode. ${assetSummary || "Receipts stay attached."} Feed read: ${feed.detectorLabel}. ${feed.correctionMode}. ${exportedFormats.length ? `Already exported: ${exportedFormats.join(", ")}.` : ""}`
    : `Approve the packet to unlock copy, preview, and sharing. Current detector read: ${feed.detectorLabel}.`;
  elements.shareLink.textContent = shareUrl || "Share preview will appear here after approval.";
  elements.exportPackaging.textContent = feed.correctionMode;
  elements.exportConfidence.textContent = `${claimStatusText(claim.status)} / ${detector.confidenceBand}`;
  elements.exportAngle.textContent = feed.hookSeed || bundle.hook;
  elements.exportModels.textContent = detector.responseMode;
  elements.exportAssets.textContent = assetSummary || "No generated media attached yet.";
  elements.exportAvoidLine.textContent = detector.deceptionPatterns[0] || "Avoid mirroring the hottest misleading framing.";
  elements.exportModerationNote.textContent = `${detector.riskToAudience}. Keep replies tied to the record.`;
  elements.exportReceiptsLine.textContent = [claim.citations[0], claim.citations[1]].filter(Boolean).join(" | ") || bundle.citations.slice(0, 2).join(" | ");
  elements.exportPreviewTitle.textContent = bundle.hook;
  elements.exportPreviewSummary.textContent = bundle.shareSummary;
  elements.exportPreviewPrompt.textContent = bundle.commentPrompt;
  elements.exportPreviewGuardrail.textContent = detector.missingContextType;

  elements.exportHandoffStatus.dataset.status = approved ? "supported" : "draft";
  elements.exportHandoffStatus.textContent = approved ? "Handoff ready" : "Review locked";
  elements.exportPreviewStatus.dataset.status = approved ? "packet" : "draft";
  elements.exportPreviewStatus.textContent = approved ? "Preview available" : "Preview locked";
  elements.exportGuidance.textContent = approved
    ? `Best next move: copy the handoff or open the preview before sharing it wider. Lead with the feed correction mode: ${feed.correctionMode}.`
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
  const feed = getFeedSignals(packet.id);
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
  elements.stepVerifyStatus.textContent = `${claimStatusText(claim.status)} / ${feed.spreadHeat} heat`;
  elements.stepDraftStatus.textContent = getGeneratedBundle() ? `AI draft ready / ${feed.correctionMode}` : `${bundle.label} / ${feed.correctionMode}`;
  elements.stepExportStatus.textContent = workspace.reviewStatus === "approved"
    ? "Approved"
      : blockers.length
        ? `${blockers.length} blockers`
        : "Ready";

  elements.questionInput.disabled = readonlyMode;
  elements.saveStatus.textContent = saveStatusText(store.workspace.lastSavedAt);
  elements.stageHost.classList.add("has-active");

  document.querySelectorAll("[data-stage-trigger]").forEach((button) => {
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
  const feed = getFeedSignals(packet.id);

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
      title: "Add the clip or claim people are actually passing around",
      text: `That one prompt makes the workflow click. Current spread pattern: ${feed.spreadPattern}.`,
      button: "Add a question"
    };
  } else if (!allChecklistDone(workspace) && activeStage !== "verify" && activeStage !== "draft") {
    config = {
      stage: "verify",
      label: "Recommended next step",
      title: `Pressure-test ${packet.shortLabel.toLowerCase()} before you package it`,
      text: `Open the loudest claim and clear the blockers before approval. Detector read: ${feed.detectorLabel}.`,
      button: "Go to verify"
    };
  } else if (activeStage === "draft" && !getGeneratedBundle()) {
    config = {
      stage: "draft",
      label: "Make it sharper",
      title: `Generate a stronger ${audience.label.toLowerCase()} cut from the verified packet`,
      text: `Start with a fresh draft, then add visual polish if needed. Best correction mode: ${feed.correctionMode}.`,
      button: "Open draft studio"
    };
  } else if (workspace.reviewStatus !== "approved") {
    config = {
      stage: "export",
      label: "Almost there",
      title: `Approve the ${audience.label.toLowerCase()} handoff to unlock export`,
      text: blockers.length
        ? `${blockers.length} review item${blockers.length === 1 ? "" : "s"} still block export.`
        : `The packet is ready for approval and share preview generation. Feed read: ${feed.detectorLabel}.`,
      button: "Go to export"
    };
  } else {
    config = {
      stage: "export",
      label: "Ready to move",
      title: "Copy, download, or share the creator handoff",
      text: `The export package is unlocked. Hand it off, remix it for another audience, or open the read-only preview. Lead with ${feed.correctionMode}.`,
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
  renderQueue();
  renderPackets();
  renderPacketDetail();
  renderClaims();
  renderClaimDetail();
  renderClaimDetector();
  renderFormats();
  renderDraft();
  renderResponseKit();
  renderAiStudio();
  renderRisks();
  renderChecklist();
  renderReviewerNotes();
  renderGateStatus();
  renderExportCard();
  renderHistory();
  renderStepRail();
  renderNextAction();
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

  if (store.workspace.queue.length && activeStage === "intake") {
    activeStage = "verify";
  }
}

function hydrateStore(data) {
  store.audiences = data.audiences;
  store.packets = data.packets;
  store.workspace = data.workspace;
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
  const seedBundle = packet.outputBundles[workspace.selectedFormat] || getBundle();
  const currentBundle = getBundle();
  const currentQueue = store.workspace?.queue?.[0] || packet.question;
  const feed = getFeedSignals(packet.id);

  return {
    packet,
    audience,
    claim,
    workspace,
    seedBundle,
    body: {
      audience: audience.id,
      goal: `Create a ${seedBundle.label.toLowerCase()} for ${audience.label.toLowerCase()} mode that can interrupt a TikTok-style misinformation loop.`,
      format: workspace.selectedFormat,
      packetTitle: packet.label,
      packetSummary: packet.summary,
      coreQuestion: currentQueue,
      claim: `${claim.title} ${claim.summary}`,
      evidence: claim.evidence,
      gaps: claim.gap,
      citations: currentBundle?.citations?.length ? currentBundle.citations : claim.citations,
      manipulationSignals: [...packet.manipulation, ...claim.signals].slice(0, 5),
      additionalContext: `${audience.draftRule} ${packet.amplification} Feed pattern: ${feed.spreadPattern}. Detector read: ${feed.detectorLabel}. Correction mode: ${feed.correctionMode}.`,
      feedSignals: feed,
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
      instructions: extraInstructions
    }
  };
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

    await persistState(
      {
        packetId: request.packet.id,
        workspacePatch: {
          generatedBundlesByFormat,
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

      await persistState(
        {
          packetId: request.packet.id,
          workspacePatch: {
            generatedBundlesByFormat,
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
      body: JSON.stringify({ prompt, size: "1536x1024", quality: "medium", outputFormat: "png" })
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
      body: JSON.stringify({ prompt, size: "1280x720", seconds: 8 })
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

    if (event.target.id === "generate-text") {
      if (readonlyMode) {
        return;
      }

      await generateTextDraft(elements.generateText);
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
