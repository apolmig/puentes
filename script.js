const store = {
  audiences: [],
  packets: [],
  workspace: null
};

const elements = {};
let readonlyMode = false;
let feedbackTimer = null;

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

  elements.heroQuestion.textContent = queue[0] || packet.question;
  elements.heroBefore.textContent = packet.summary;
  elements.heroAfter.textContent = bundle.caption;
  elements.heroOutputLabel.textContent = `${bundle.label} ready for ${audience.label.toLowerCase()} mode`;
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
  elements.saveStatus.textContent = formatSavedTime(store.workspace?.lastSavedAt);
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

  elements.draftKicker.textContent = `${bundle.label} · ${audience.label} mode`;
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

  elements.stepIntakeStatus.textContent = store.workspace.queue.length ? `${store.workspace.queue.length} queued` : "Ready";
  elements.stepVerifyStatus.textContent = claimStatusText(claim.status);
  elements.stepDraftStatus.textContent = bundle.label;
  elements.stepExportStatus.textContent = workspace.reviewStatus === "approved"
    ? "Approved"
    : blockers.length
      ? `${blockers.length} blockers`
      : "Ready";

  elements.questionInput.disabled = readonlyMode;
  elements.saveStatus.textContent = formatSavedTime(store.workspace.lastSavedAt);
  document.title = `Puentes | ${packet.shortLabel} -> ${bundle.label}`;
}

function renderReadonlyState() {
  document.body.classList.toggle("is-share-mode", readonlyMode);
  elements.readonlyBanner.hidden = !readonlyMode;
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
}

function applyShareModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const sharedPacketId = params.get("share");

  readonlyMode = Boolean(sharedPacketId && store.packets.some((packet) => packet.id === sharedPacketId));
  if (!readonlyMode) {
    return;
  }

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
  const data = await requestJson("/api/bootstrap");
  store.audiences = data.audiences;
  store.packets = data.packets;
  store.workspace = data.workspace;
  applyShareModeFromUrl();
  renderAll();
}

async function persistState({ appPatch = {}, packetId, workspacePatch = {} }, action, detail) {
  const data = await requestJson("/api/state", {
    method: "POST",
    body: JSON.stringify({ appPatch, packetId, workspacePatch, action, detail })
  });

  store.workspace = data.workspace;
  applyShareModeFromUrl();
  renderAll();
}

async function queueQuestion(question) {
  const data = await requestJson("/api/queue", {
    method: "POST",
    body: JSON.stringify({ question })
  });

  store.workspace = data.workspace;
  applyShareModeFromUrl();
  renderAll();
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
    } else {
      setAppStatus();
    }
  } catch (error) {
    setAppStatus("The workspace failed to load. Refresh and try again.", "error");
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", init);
