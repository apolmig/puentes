const store = {
  audiences: [],
  packets: [],
  workspace: null
};

const STAGES = ["intake", "verify", "draft", "export"];
const LOCAL_STORAGE_KEY = "puentes-visual-demo-v3";
const elements = {};
let readonlyMode = false;
let feedbackTimer = null;
let persistenceMode = "api";
let activeStage = "intake";

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

function getBundle(packetId = getPacket()?.id) {
  const packet = getPacket(packetId);
  const workspace = getWorkspace(packetId);
  return packet?.outputBundles?.[workspace?.selectedFormat] || packet?.outputBundles?.carousel || null;
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

  return [
    "Puentes creator handoff",
    "",
    `Packet: ${packet.label}`,
    `Audience: ${audience.label}`,
    `Format: ${bundle.label}`,
    `Review status: ${workspace.reviewStatus}`,
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
    "Current claim check",
    claim.title,
    claim.summary,
    "",
    "Citations",
    ...bundle.citations.map((citation) => `- ${citation}`),
    "",
    "Reviewer notes",
    workspace.reviewerNotes || "No reviewer note added.",
    "",
    "Share summary",
    bundle.shareSummary
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

  elements.draftKicker.textContent = `${bundle.label} / ${audience.label} mode`;
  elements.draftTitle.textContent = bundle.title;
  elements.draftSummary.textContent = `${draft.summary} ${audience.draftRule}`;
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
  const approved = workspace.reviewStatus === "approved";
  const exportedFormats = workspace.exportedFormats || [];
  const shareUrl = approved ? (workspace.shareUrl || getShareUrl(packet.id)) : "";

  elements.exportTitle.textContent = approved
    ? `${bundle.title} is ready to hand off`
    : "Export unlocks after approval";
  elements.exportSummary.textContent = approved
    ? `${bundle.label} is ready for ${audience.label.toLowerCase()} mode. Copy the asset, download the handoff, or share a read-only preview. ${exportedFormats.length ? `Formats already exported: ${exportedFormats.join(", ")}.` : ""}`
    : "Approve the packet to unlock copy, download, and read-only sharing.";
  elements.shareLink.textContent = shareUrl || "Share preview will appear here after approval.";

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
  elements.stepDraftStatus.textContent = bundle.label;
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
    text: "Pick the audience and paste the real question people are circulating.",
    button: "Go to intake"
  };

  if (readonlyMode) {
    config = {
      stage: "export",
      label: "Read-only mode",
      title: "Review the creator handoff",
      text: "This preview is built for inspecting the packaged output, citations, and final share summary.",
      button: "Open export"
    };
  } else if (!store.workspace.queue.length) {
    config = {
      stage: "intake",
      label: "First move",
      title: "Add the question people are actually asking",
      text: "That one prompt makes the whole workflow feel anchored and much easier to understand.",
      button: "Add a question"
    };
  } else if (!allChecklistDone(workspace) && activeStage !== "verify" && activeStage !== "draft") {
    config = {
      stage: "verify",
      label: "Recommended next step",
      title: `Pressure-test ${packet.shortLabel.toLowerCase()} before you package it`,
      text: "Open the loudest claim, scan the evidence, and clear the review blockers before approval.",
      button: "Go to verify"
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
  renderQueue();
  renderPackets();
  renderPacketDetail();
  renderClaims();
  renderClaimDetail();
  renderFormats();
  renderDraft();
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
  cacheElements();
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
  } catch (error) {
    setAppStatus("The workspace failed to load. Refresh and try again.", "error");
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", init);
