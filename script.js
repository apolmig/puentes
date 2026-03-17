const store = {
  audiences: [],
  packets: [],
  state: null
};

const elements = {};
let checklistTemplate = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function cacheElements() {
  Object.assign(elements, {
    audienceTabs: document.getElementById("audience-tabs"),
    audienceKicker: document.getElementById("audience-kicker"),
    audienceTitle: document.getElementById("audience-title"),
    audienceSummary: document.getElementById("audience-summary"),
    audienceFocus: document.getElementById("audience-focus"),
    saveStatus: document.getElementById("save-status"),
    questionInput: document.getElementById("question-input"),
    queueList: document.getElementById("queue-list"),
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
    draftPoints: document.getElementById("draft-points"),
    draftNote: document.getElementById("draft-note"),
    manipulationList: document.getElementById("manipulation-list"),
    amplificationNote: document.getElementById("amplification-note"),
    reviewChecklist: document.getElementById("review-checklist"),
    reviewerNotes: document.getElementById("reviewer-notes"),
    gateStatusCard: document.getElementById("gate-status-card"),
    gateStatusTitle: document.getElementById("gate-status-title"),
    gateStatusText: document.getElementById("gate-status-text"),
    historyList: document.getElementById("history-list")
  });
}

function getAudience() {
  return store.audiences.find((audience) => audience.id === store.state.selectedAudienceId);
}

function getPacket() {
  return store.packets.find((packet) => packet.id === store.state.selectedPacketId);
}

function getClaim() {
  const packet = getPacket();
  return packet.claims[store.state.selectedClaimIndex] || packet.claims[0];
}

function getDraft() {
  const packet = getPacket();
  return packet.drafts[store.state.selectedFormat] || packet.drafts.carousel;
}

function freshChecklist() {
  return checklistTemplate.map((item) => ({ ...item, done: false }));
}

function createListMarkup(items) {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function formatSavedTime(timestamp) {
  if (!timestamp) {
    return "Saved locally";
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Saved locally";
  }
  return `Saved ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function historyMarkup(entry) {
  return `
    <li>
      <strong>${entry.action}</strong>
      <span>${entry.detail || ""}</span>
      <span class="history-meta">${new Date(entry.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
    </li>
  `;
}

function audienceTabMarkup(audience) {
  const active = audience.id === store.state.selectedAudienceId;
  return `
    <button class="audience-tab${active ? " is-active" : ""}" type="button" data-audience-id="${audience.id}" aria-selected="${active}">
      <strong>${audience.label}</strong>
      <span>${audience.kicker}</span>
    </button>
  `;
}

function packetTabMarkup(packet) {
  const active = packet.id === store.state.selectedPacketId;
  return `
    <button class="packet-tab${active ? " is-active" : ""}" type="button" data-packet-id="${packet.id}" aria-selected="${active}">
      <strong>${packet.label}</strong>
      <span>${packet.summary}</span>
    </button>
  `;
}

function claimTabMarkup(claim, index) {
  const active = index === store.state.selectedClaimIndex;
  const statusText = claim.status === "mixed" ? "Contested" : claim.status === "supported" ? "Supported" : "Unclear";
  return `
    <button class="claim-tab${active ? " is-active" : ""}" type="button" data-claim-index="${index}" aria-selected="${active}">
      <strong>${claim.title}</strong>
      <span>${statusText}: ${claim.summary}</span>
    </button>
  `;
}

function checklistItemMarkup(item) {
  return `
    <label class="check-item${item.done ? " is-complete" : ""}">
      <input type="checkbox" data-check-id="${item.id}" ${item.done ? "checked" : ""}>
      <span>${item.label}</span>
    </label>
  `;
}

function renderAudience() {
  const audience = getAudience();
  elements.audienceTabs.innerHTML = store.audiences.map(audienceTabMarkup).join("");
  elements.audienceKicker.textContent = audience.kicker;
  elements.audienceTitle.textContent = audience.title;
  elements.audienceSummary.textContent = audience.summary;
  elements.audienceFocus.innerHTML = createListMarkup(audience.focus);
  elements.questionInput.placeholder = audience.questionPlaceholder;
  elements.saveStatus.textContent = formatSavedTime(store.state.lastSavedAt);
}

function renderQueue() {
  elements.queueList.innerHTML = createListMarkup(store.state.queue.slice(0, 6));
}

function renderPackets() {
  elements.packetList.innerHTML = store.packets.map(packetTabMarkup).join("");
  elements.packetCount.textContent = `${store.packets.length} demo packets`;
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
  elements.claimList.innerHTML = packet.claims.map(claimTabMarkup).join("");
  elements.claimCount.textContent = `${packet.claims.length} claims in queue`;
}

function renderClaimDetail() {
  const claim = getClaim();
  const statusText = claim.status === "mixed" ? "Contested" : claim.status === "supported" ? "Supported" : "Unclear";
  elements.claimTitle.textContent = claim.title;
  elements.claimStatus.textContent = statusText;
  elements.claimStatus.dataset.status = claim.status;
  elements.claimSummary.textContent = claim.summary;
  elements.claimEvidence.textContent = claim.evidence;
  elements.claimGap.textContent = claim.gap;
  elements.claimCitations.innerHTML = createListMarkup(claim.citations);
  elements.claimSignals.innerHTML = createListMarkup(claim.signals);
}

function renderFormats() {
  const audience = getAudience();
  document.querySelectorAll(".format-tab").forEach((button) => {
    const active = button.dataset.format === store.state.selectedFormat;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  elements.draftState.textContent = store.state.reviewStatus === "approved"
    ? "Approved handoff"
    : store.state.reviewStatus === "revision"
      ? "Needs revision"
      : `${audience.label} draft`;
}

function renderDraft() {
  const audience = getAudience();
  const draft = getDraft();
  elements.draftKicker.textContent = `${draft.kicker} · ${audience.label} mode`;
  elements.draftTitle.textContent = draft.title;
  elements.draftSummary.textContent = `${draft.summary} ${audience.summary}`;
  elements.draftPoints.innerHTML = createListMarkup(draft.points);
  elements.draftNote.textContent = `${draft.note} ${audience.draftRule}`;
}

function renderRisks() {
  const packet = getPacket();
  elements.manipulationList.innerHTML = createListMarkup(packet.manipulation);
  elements.amplificationNote.textContent = packet.amplification;
}

function renderChecklist() {
  elements.reviewChecklist.innerHTML = store.state.checklist.map(checklistItemMarkup).join("");
}

function renderGateStatus() {
  const allDone = store.state.checklist.every((item) => item.done);
  if (store.state.reviewStatus === "approved") {
    elements.gateStatusCard.dataset.state = "approved";
    elements.gateStatusTitle.textContent = "Approved for educator or creator handoff";
    elements.gateStatusText.textContent = "The reviewer completed the checks and approved this packet for human-led adaptation, not autopublishing.";
  } else if (store.state.reviewStatus === "revision") {
    elements.gateStatusCard.dataset.state = "revision";
    elements.gateStatusTitle.textContent = "Sent back for revision";
    elements.gateStatusText.textContent = "The draft needs stronger sourcing, clearer tone, or a better explanation of uncertainty before handoff.";
  } else if (allDone) {
    elements.gateStatusCard.dataset.state = "pending";
    elements.gateStatusTitle.textContent = "Checklist complete. Approval is now available.";
    elements.gateStatusText.textContent = "The packet has passed reviewer checks, but it still requires an explicit human approval decision.";
  } else {
    elements.gateStatusCard.dataset.state = "pending";
    elements.gateStatusTitle.textContent = "Waiting for reviewer checks";
    elements.gateStatusText.textContent = "Complete the checklist before approving a draft for educator or creator handoff.";
  }
}

function renderHistory() {
  const history = store.state.history || [];
  elements.historyList.innerHTML = history.length
    ? history.map(historyMarkup).join("")
    : "<li><strong>No activity yet</strong><span class=\"history-meta\">Actions will appear here as the review moves.</span></li>";
}

function renderReviewerNotes() {
  elements.reviewerNotes.value = store.state.reviewerNotes || "";
}

function renderAll() {
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
  renderHistory();
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

async function bootstrap() {
  const data = await requestJson("/api/bootstrap");
  store.audiences = data.audiences;
  store.packets = data.packets;
  store.state = data.state;
  checklistTemplate = clone(data.state.checklist);
  renderAll();
}

async function persistState(patch, action, detail) {
  const data = await requestJson("/api/state", {
    method: "POST",
    body: JSON.stringify({ patch, action, detail })
  });
  store.state = data.state;
  renderAll();
}

async function queueQuestion(question) {
  const data = await requestJson("/api/queue", {
    method: "POST",
    body: JSON.stringify({ question })
  });
  store.state = data.state;
  renderAll();
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    const audienceButton = event.target.closest("[data-audience-id]");
    if (audienceButton) {
      const audience = store.audiences.find((item) => item.id === audienceButton.dataset.audienceId);
      if (!audience || audience.id === store.state.selectedAudienceId) {
        return;
      }
      await persistState(
        {
          selectedAudienceId: audience.id,
          selectedFormat: audience.defaultFormat,
          reviewStatus: "pending"
        },
        "Switched audience",
        `${audience.label} mode`
      );
      return;
    }

    const packetButton = event.target.closest("[data-packet-id]");
    if (packetButton) {
      const packet = store.packets.find((item) => item.id === packetButton.dataset.packetId);
      const audience = getAudience();
      await persistState(
        {
          selectedPacketId: packet.id,
          selectedClaimIndex: 0,
          selectedFormat: audience.defaultFormat,
          reviewStatus: "pending",
          checklist: freshChecklist(),
          reviewerNotes: ""
        },
        "Opened packet",
        packet.label
      );
      return;
    }

    const claimButton = event.target.closest("[data-claim-index]");
    if (claimButton) {
      const claim = getPacket().claims[Number(claimButton.dataset.claimIndex)];
      await persistState(
        {
          selectedClaimIndex: Number(claimButton.dataset.claimIndex),
          reviewStatus: "pending"
        },
        "Opened claim",
        claim.title
      );
      return;
    }

    const formatButton = event.target.closest("[data-format]");
    if (formatButton) {
      await persistState(
        { selectedFormat: formatButton.dataset.format },
        "Switched output",
        formatButton.textContent.trim()
      );
      return;
    }

    if (event.target.id === "queue-question") {
      const question = elements.questionInput.value.trim();
      if (!question) {
        return;
      }
      await queueQuestion(question);
      elements.questionInput.value = "";
      return;
    }

    if (event.target.id === "load-next-packet") {
      const currentIndex = store.packets.findIndex((packet) => packet.id === store.state.selectedPacketId);
      const nextPacket = store.packets[(currentIndex + 1) % store.packets.length];
      const audience = getAudience();
      await persistState(
        {
          selectedPacketId: nextPacket.id,
          selectedClaimIndex: 0,
          selectedFormat: audience.defaultFormat,
          reviewStatus: "pending",
          checklist: freshChecklist(),
          reviewerNotes: ""
        },
        "Opened packet",
        nextPacket.label
      );
      return;
    }

    if (event.target.id === "save-note") {
      await persistState(
        { reviewerNotes: elements.reviewerNotes.value.trim() },
        "Saved reviewer note",
        elements.reviewerNotes.value.trim() || "Cleared note text"
      );
      return;
    }

    if (event.target.id === "clear-note") {
      elements.reviewerNotes.value = "";
      await persistState(
        { reviewerNotes: "" },
        "Cleared reviewer note",
        getPacket().label
      );
      return;
    }

    if (event.target.id === "approve-review") {
      const allDone = store.state.checklist.every((item) => item.done);
      await persistState(
        { reviewStatus: allDone ? "approved" : "pending" },
        allDone ? "Approved draft" : "Approval blocked",
        allDone ? getPacket().label : "Checklist is still incomplete"
      );
      return;
    }

    if (event.target.id === "request-revision") {
      await persistState(
        { reviewStatus: "revision" },
        "Requested revision",
        getPacket().label
      );
    }
  });

  document.addEventListener("change", async (event) => {
    const checkbox = event.target.closest("[data-check-id]");
    if (!checkbox) {
      return;
    }

    const nextChecklist = store.state.checklist.map((item) => (
      item.id === checkbox.dataset.checkId
        ? { ...item, done: checkbox.checked }
        : item
    ));

    await persistState(
      {
        checklist: nextChecklist,
        reviewStatus: "pending"
      },
      checkbox.checked ? "Completed checklist item" : "Unchecked checklist item",
      nextChecklist.find((item) => item.id === checkbox.dataset.checkId).label
    );
  });
}

async function init() {
  cacheElements();
  bindEvents();
  try {
    await bootstrap();
  } catch (error) {
    elements.saveStatus.textContent = "Load failed";
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", init);
