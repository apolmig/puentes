const packets = [
  {
    id: "housing",
    label: "Housing vote packet",
    shortLabel: "Housing",
    type: "City docs + reporting",
    date: "Updated Mar 16",
    trust: "Mixed public record",
    summary: "A packet combining city council notes, local reporting, and youth questions about a housing vote that is getting flattened online into team sports.",
    question: "What actually changed in the housing vote, and which clips are turning a complicated issue into engagement bait?",
    sources: [
      "City council agenda summary and amendment notes",
      "Local newsroom explainer on zoning and tenant protections",
      "Youth workshop questions collected after the vote"
    ],
    amplification: "Short clips are pushing the fight between two council members harder than the policy details, so the conflict is spreading faster than the facts.",
    manipulation: [
      "False binary framing: either pro-housing or anti-neighborhood",
      "Scapegoating language aimed at renters and migrants",
      "Outrage clips detached from amendment context"
    ],
    claims: [
      {
        title: "The vote removed all tenant protections.",
        status: "unclear",
        summary: "Some tenant provisions changed, but the packet does not support the idea that every protection disappeared.",
        evidence: "Amendment notes show tenant notice requirements stayed in place while affordability thresholds changed in two zones.",
        gap: "A final implementation memo is still missing, so the downstream effect on enforcement is not yet fully known.",
        citations: [
          "Council amendment tracker section 4",
          "Local newsroom explainer paragraph on tenant notice"
        ],
        signals: [
          "Absolute language like all or none overstates the record",
          "Posts pair policy edits with eviction imagery not tied to the vote"
        ]
      },
      {
        title: "The measure only benefits developers.",
        status: "mixed",
        summary: "Developers do gain from increased buildability, but the packet also shows affordability and permit conditions that shape public outcomes.",
        evidence: "The city summary links density bonuses to affordability targets and transit-access rules, though critics note those targets may still be weak.",
        gap: "Long-term delivery depends on enforcement and market behavior, which this packet cannot fully verify yet.",
        citations: [
          "City summary on density bonuses",
          "Reporter interview with housing researchers"
        ],
        signals: [
          "Identity-based villain language narrows discussion",
          "Memes collapse incentive design into personal motive"
        ]
      },
      {
        title: "Young renters asked for clearer explanations, not just campaign slogans.",
        status: "supported",
        summary: "Community questions keep asking for plain-language comparisons of what changed and who is affected.",
        evidence: "Workshop intake notes include repeated requests for side-by-side comparisons and simpler terms around zoning and affordability bands.",
        gap: "The sample is from one network and should not be treated as universal youth opinion.",
        citations: [
          "Workshop intake sheet",
          "Mentor debrief summary"
        ],
        signals: [
          "Useful reframing opportunity: move from factional slogans to concrete changes",
          "Keep audience language direct without sounding patronizing"
        ]
      }
    ],
    drafts: {
      carousel: {
        kicker: "Carousel pack",
        title: "Housing vote in 5 slides: what changed, what did not, what is still unclear",
        summary: "Start with the real change, show what stayed, and leave room for uncertainty instead of pretending the story is settled.",
        points: [
          "Slide 1 hook: People online are saying the housing vote changed everything. The record is more specific than that.",
          "Slide 2: Show the two edits that actually happened in plain language.",
          "Slide 3: Name one tenant protection that stayed in place.",
          "Slide 4: Add a what we still do not know box on implementation.",
          "Slide 5: Close with sources and one question for discussion."
        ],
        note: "Keep every slide tied to a document line or reporting note so the post feels native but still has receipts."
      },
      video: {
        kicker: "Short video script",
        title: "A 45-second housing vote myth check",
        summary: "Use one viral claim, one grounded correction, and one open question so the script stays clear without overstating certainty.",
        points: [
          "Hook: Online, people are saying the vote killed every tenant protection. That is not what the packet shows.",
          "Beat 2: Show the two policy edits that actually happened.",
          "Beat 3: Name one protection that stayed and one implementation question that is still open.",
          "Close: Point viewers to the source list instead of ending on outrage."
        ],
        note: "Do not use confrontation clips unless they add factual context instead of just emotional heat."
      },
      classroom: {
        kicker: "Class prompts",
        title: "How do housing policy debates get flattened online?",
        summary: "Use the packet to separate document-backed facts from identity-based framing and high-engagement simplification.",
        points: [
          "Which claim in the packet is strongest, and what source makes it strongest?",
          "Where do you see a false binary shaping how the issue is talked about?",
          "What missing information would you want before making a hard conclusion?"
        ],
        note: "Prompt inquiry, not alignment. The goal is evidence comparison and language awareness."
      },
      creator: {
        kicker: "Creator caption",
        title: "Low-drama caption + comment prompt",
        summary: "A creator-facing handoff that sounds natural in the feed while making the sourcing visible and keeping the tone calm.",
        points: [
          "Caption opener: Quick reset - the housing vote did change some rules, but not in the all-or-nothing way people are posting it.",
          "Middle line: Here is what changed, here is what stayed, and here is what is still unresolved.",
          "Comment prompt: What part of this issue gets most distorted when it hits the feed?",
          "End line: Sources are in the caption notes so people can check the record themselves."
        ],
        note: "This handoff should help a trusted creator sound grounded, not forced, and not like another outrage page."
      }
    }
  },
  {
    id: "transit",
    label: "Transit budget packet",
    shortLabel: "Transit",
    type: "Budget review",
    date: "Updated Mar 12",
    trust: "Public budget plus reporting",
    summary: "A packet on a regional transit budget debate where viral screenshots are shaping the story faster than the actual route notes and service tables.",
    question: "How should young riders understand route cuts and expansions without getting dragged into culture-war framing?",
    sources: [
      "Regional transit draft budget tables",
      "Service equity memo",
      "Local reporting on rider impact and public comment"
    ],
    amplification: "Platform conversation is being driven by map screenshots without the budget notes that explain service frequency and coverage tradeoffs.",
    manipulation: [
      "Selective screenshots hide route additions while spotlighting cuts",
      "Posts personalize operational decisions as moral betrayal",
      "Comment threads reward anger faster than comparison"
    ],
    claims: [
      {
        title: "The budget cuts youth access across the board.",
        status: "mixed",
        summary: "Some riders lose direct routes, but the packet also shows expanded frequency in other corridors used by students and shift workers.",
        evidence: "The budget tables reduce service on two lines while increasing frequency on three overlapping corridors with higher ridership and school connections.",
        gap: "The packet does not yet include travel-time estimates for every affected neighborhood.",
        citations: [
          "Draft budget service table",
          "Equity memo on corridor frequency"
        ],
        signals: [
          "Across the board language hides uneven impacts",
          "Map visuals can imply universal loss when the record is mixed"
        ]
      },
      {
        title: "The agency ignored public comment entirely.",
        status: "unclear",
        summary: "The record shows public comments were logged and cited, but it is not yet clear how much they changed the final proposal.",
        evidence: "The board packet references public comment themes, including student commute concerns and weekend access issues.",
        gap: "The revised final budget packet has not been released, so response quality cannot be fully scored yet.",
        citations: [
          "Board packet appendix on public comments",
          "Reporter notes from committee hearing"
        ],
        signals: [
          "Totalizing phrases like ignored entirely flatten partial responsiveness",
          "Clips of frustrated testimony are circulating without board replies"
        ]
      },
      {
        title: "Young riders need a route-by-route explanation, not a spreadsheet dump.",
        status: "supported",
        summary: "Community intake shows demand for simpler route explainers and impact summaries.",
        evidence: "Questions from youth groups focus on commute impact, weekend job access, and what alternative routes actually exist.",
        gap: "A clearer rider-facing explainer still has to be produced.",
        citations: [
          "Youth transport clinic notes",
          "Teacher feedback summary"
        ],
        signals: [
          "Opportunity to reframe technical tables into practical rider impact",
          "Use plain language about time, access, and reliability"
        ]
      }
    ],
    drafts: {
      carousel: {
        kicker: "Carousel pack",
        title: "Transit budget in 4 quick cards",
        summary: "Translate the budget into direct rider impact, show who gains or loses frequency, and name what is still pending.",
        points: [
          "Card 1 hook: This screenshot is real, but it is not the full transit story.",
          "Card 2: Name the two biggest cuts in plain language.",
          "Card 3: Show the key frequency increases students should also know about.",
          "Card 4: End with what the final board vote could still change."
        ],
        note: "Anchor every route claim to the budget table or public hearing record so the post is usable and checkable."
      },
      video: {
        kicker: "Short video script",
        title: "A 30-second map myth check",
        summary: "Use the viral screenshot as the opening, then widen the frame with the missing service data.",
        points: [
          "Hook: This map screenshot is real, but it leaves out the service changes around it.",
          "Beat 2: Show one route loss and one frequency gain affecting student travel.",
          "Beat 3: Explain what riders still need from the final board vote.",
          "Close: Tell viewers where the actual route table lives."
        ],
        note: "Do not crop the evidence in a way that recreates the same misleading effect."
      },
      classroom: {
        kicker: "Class prompts",
        title: "How do budget decisions become feed narratives?",
        summary: "Compare technical evidence with platform framing and ask students what information changed their interpretation.",
        points: [
          "Which post in the packet feels most persuasive before checking sources, and why?",
          "What data point complicated your first impression?",
          "How would you explain the issue to a friend who only saw one screenshot?"
        ],
        note: "Keep the discussion centered on evidence, framing, and public reasoning."
      },
      creator: {
        kicker: "Creator caption",
        title: "Caption structure for a transit explainer",
        summary: "A creator handoff that opens with the screenshot people already saw, then calmly adds the missing context.",
        points: [
          "Caption opener: A lot of people are posting this transit map like it tells the whole story. It does not.",
          "Middle line: Some riders are losing direct service, but other student-used corridors are gaining frequency.",
          "Comment prompt: What route detail would help you understand the tradeoff faster?",
          "End line: Sources are linked so riders can compare the screenshot to the actual budget notes."
        ],
        note: "Keep the tone practical and rider-first so the creator is useful, not just loud."
      }
    }
  },
  {
    id: "school-board",
    label: "School board civics packet",
    shortLabel: "Schools",
    type: "Education policy",
    date: "Updated Mar 10",
    trust: "Board record plus community notes",
    summary: "A packet on a school board discussion about curriculum transparency, where reaction content is outrunning the actual board FAQ and process notes.",
    question: "How can Puentes help educators and youth creators explain the policy without becoming another outrage account?",
    sources: [
      "School board agenda and public FAQ",
      "Local education reporter notes",
      "Questions from youth media club mentors and teachers"
    ],
    amplification: "Algorithmic spread is favoring identity-conflict clips and reaction videos rather than the board FAQ or classroom-facing guidance.",
    manipulation: [
      "Culture-war labels replace actual policy language",
      "Selective quoting strips out procedural context",
      "Creators feel pressure to perform certainty to keep attention"
    ],
    claims: [
      {
        title: "The board banned civic discussion materials.",
        status: "unclear",
        summary: "The packet shows new review procedures and disclosure rules, but not a blanket ban on civic discussion materials.",
        evidence: "The agenda language focuses on review, notification, and approved resource lists rather than removing all discussion materials.",
        gap: "Teachers are still waiting for the implementation memo that defines how the review procedure works in practice.",
        citations: [
          "Board agenda item on instructional review",
          "FAQ on classroom resources"
        ],
        signals: [
          "Ban language compresses a procedural issue into a maximal claim",
          "Reaction posts often skip the FAQ entirely"
        ]
      },
      {
        title: "Educators want a transparent process and fewer rumor cycles.",
        status: "supported",
        summary: "Teacher and mentor questions repeatedly ask for clearer process explanations so families and students are not left to infer changes from viral clips.",
        evidence: "Community notes request short process explainers, appeal timelines, and examples of how a review decision would be communicated.",
        gap: "The board has not yet published a youth-facing communication template.",
        citations: [
          "Teacher roundtable notes",
          "Mentor debrief on family questions"
        ],
        signals: [
          "Useful depolarizing move: explain process before debate",
          "Keep wording concrete and avoid culture-war shortcuts"
        ]
      },
      {
        title: "Online creators are being pushed toward hot takes instead of source-linked explainers.",
        status: "supported",
        summary: "The packet includes creator feedback that speed and platform pressure make it harder to publish nuanced civic explainers.",
        evidence: "Trusted creators reported that reaction-style content outperforms citation-heavy explainers even when they prefer the latter format.",
        gap: "The packet is anecdotal and does not quantify the platform effect across creators.",
        citations: [
          "Creator feedback interviews",
          "Youth media mentor notes"
        ],
        signals: [
          "Important product need: faster rigor, not faster outrage",
          "Acknowledge uncertainty without losing clarity"
        ]
      }
    ],
    drafts: {
      carousel: {
        kicker: "Carousel pack",
        title: "School board update in plain language",
        summary: "Explain the procedural change first, then separate verified facts from rumor-driven interpretations.",
        points: [
          "Card 1 hook: People online are calling this a ban. The board record says something narrower.",
          "Card 2: Define the procedural change in one sentence.",
          "Card 3: Show what is documented already and what still depends on implementation.",
          "Card 4: End with how students and families can follow future updates."
        ],
        note: "Preserve citations so educators and creators can point back to the board record instead of debate clips."
      },
      video: {
        kicker: "Short video script",
        title: "Process before panic: a 40-second board vote recap",
        summary: "Open with the rumor, correct it using the record, then explain what viewers should watch next.",
        points: [
          "Hook: People online are calling this a ban. The board packet shows something more procedural.",
          "Beat 2: Show the two changes that are actually documented.",
          "Beat 3: Name the implementation memo as the next thing to watch.",
          "Close: Point viewers to the FAQ and meeting notes."
        ],
        note: "Keep the tone calm and source-led so the creator does not become part of the rumor cycle."
      },
      classroom: {
        kicker: "Class prompts",
        title: "How do procedural issues become polarized online?",
        summary: "Use the packet to compare official documents, reporting, and creator pressure in one discussion set.",
        points: [
          "Which term in the online debate carries more emotion than evidence?",
          "What source best clarified the difference between rumor and record?",
          "How should trusted creators communicate uncertainty to young audiences?"
        ],
        note: "Frame discussion around media literacy, civic process, and audience trust."
      },
      creator: {
        kicker: "Creator caption",
        title: "Caption handoff for a school board explainer",
        summary: "A creator-ready draft that keeps the opening familiar while resisting panic framing.",
        points: [
          "Caption opener: Quick context before this turns into another rumor spiral - the board changed review procedures, not everything people are claiming.",
          "Middle line: Here is what is documented, here is what is still unclear, and here is the next record to watch.",
          "Comment prompt: What is the hardest part of explaining school policy without it turning into a culture-war fight?",
          "End line: Sources are attached so this stays grounded in the record."
        ],
        note: "The creator handoff should sound human and familiar without borrowing the emotional framing of outrage content."
      }
    }
  }
];

const state = {
  selectedPacketId: packets[0].id,
  selectedClaimIndex: 0,
  selectedFormat: "carousel",
  reviewStatus: "pending",
  queue: [
    "People keep saying the housing vote changed everything. What actually changed?",
    "Can we get a short transit explainer that works for student riders and does not sound like a press release?"
  ],
  checklist: [
    { id: "sources", label: "Sources checked and citation lines kept in the handoff.", done: false },
    { id: "tone", label: "Tone reviewed for younger audiences, creator clarity, and nonpartisan framing.", done: false },
    { id: "risks", label: "Manipulation and amplification risks reviewed before handoff.", done: false }
  ]
};

function getPacket() {
  return packets.find((packet) => packet.id === state.selectedPacketId);
}

function getClaim() {
  return getPacket().claims[state.selectedClaimIndex];
}

function getDraft() {
  return getPacket().drafts[state.selectedFormat];
}

function createListMarkup(items) {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function packetTabMarkup(packet) {
  const active = packet.id === state.selectedPacketId;
  return `
    <button class="packet-tab${active ? " is-active" : ""}" type="button" data-packet-id="${packet.id}" aria-selected="${active}">
      <strong>${packet.label}</strong>
      <span>${packet.summary}</span>
    </button>
  `;
}

function claimTabMarkup(claim, index) {
  const active = index === state.selectedClaimIndex;
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

function renderQueue() {
  const queueList = document.getElementById("queue-list");
  queueList.innerHTML = createListMarkup(state.queue.slice(0, 4));
}

function renderPackets() {
  document.getElementById("packet-list").innerHTML = packets.map(packetTabMarkup).join("");
  document.getElementById("packet-count").textContent = `${packets.length} demo packets`;
}

function renderPacketDetail() {
  const packet = getPacket();
  document.getElementById("packet-type").textContent = packet.type;
  document.getElementById("packet-type").dataset.status = "packet";
  document.getElementById("packet-date").textContent = packet.date;
  document.getElementById("packet-trust").textContent = packet.trust;
  document.getElementById("packet-title").textContent = packet.label;
  document.getElementById("packet-summary").textContent = packet.summary;
  document.getElementById("packet-question").textContent = packet.question;
  document.getElementById("packet-sources").innerHTML = createListMarkup(packet.sources);
}

function renderClaims() {
  const packet = getPacket();
  document.getElementById("claim-list").innerHTML = packet.claims.map(claimTabMarkup).join("");
  document.getElementById("claim-count").textContent = `${packet.claims.length} claims in queue`;
}

function renderClaimDetail() {
  const claim = getClaim();
  const statusText = claim.status === "mixed" ? "Contested" : claim.status === "supported" ? "Supported" : "Unclear";
  const statusNode = document.getElementById("claim-status");
  document.getElementById("claim-title").textContent = claim.title;
  statusNode.textContent = statusText;
  statusNode.dataset.status = claim.status;
  document.getElementById("claim-summary").textContent = claim.summary;
  document.getElementById("claim-evidence").textContent = claim.evidence;
  document.getElementById("claim-gap").textContent = claim.gap;
  document.getElementById("claim-citations").innerHTML = createListMarkup(claim.citations);
  document.getElementById("claim-signals").innerHTML = createListMarkup(claim.signals);
}

function renderFormats() {
  document.querySelectorAll(".format-tab").forEach((button) => {
    const active = button.dataset.format === state.selectedFormat;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function renderDraft() {
  const draft = getDraft();
  document.getElementById("draft-kicker").textContent = draft.kicker;
  document.getElementById("draft-title").textContent = draft.title;
  document.getElementById("draft-summary").textContent = draft.summary;
  document.getElementById("draft-points").innerHTML = createListMarkup(draft.points);
  document.getElementById("draft-note").textContent = draft.note;
}

function renderRisks() {
  const packet = getPacket();
  document.getElementById("manipulation-list").innerHTML = createListMarkup(packet.manipulation);
  document.getElementById("amplification-note").textContent = packet.amplification;
}

function renderChecklist() {
  document.getElementById("review-checklist").innerHTML = state.checklist.map(checklistItemMarkup).join("");
}

function updateDraftState() {
  const label = document.getElementById("draft-state");
  const gateStatus = document.getElementById("gate-status-card").dataset.state;
  const text = gateStatus === "approved" ? "Approved handoff" : gateStatus === "revision" ? "Needs revision" : "Review draft";
  label.textContent = text;
}

function renderGateStatus() {
  const card = document.getElementById("gate-status-card");
  const allDone = state.checklist.every((item) => item.done);
  if (state.reviewStatus === "approved") {
    card.dataset.state = "approved";
    document.getElementById("gate-status-title").textContent = "Approved for educator or creator handoff";
    document.getElementById("gate-status-text").textContent = "The reviewer completed the checks and approved this packet for human-led adaptation, not autopublishing.";
  } else if (state.reviewStatus === "revision") {
    card.dataset.state = "revision";
    document.getElementById("gate-status-title").textContent = "Sent back for revision";
    document.getElementById("gate-status-text").textContent = "The draft needs stronger sourcing, clearer tone, or a better explanation of uncertainty before handoff.";
  } else if (allDone) {
    card.dataset.state = "pending";
    document.getElementById("gate-status-title").textContent = "Checklist complete. Approval is now available.";
    document.getElementById("gate-status-text").textContent = "The packet has passed reviewer checks, but it still requires an explicit human approval decision.";
  } else {
    card.dataset.state = "pending";
    document.getElementById("gate-status-title").textContent = "Waiting for reviewer checks";
    document.getElementById("gate-status-text").textContent = "Complete the checklist before approving a draft for educator or creator handoff.";
  }
  updateDraftState();
}

function renderAll() {
  renderQueue();
  renderPackets();
  renderPacketDetail();
  renderClaims();
  renderClaimDetail();
  renderFormats();
  renderDraft();
  renderRisks();
  renderChecklist();
  renderGateStatus();
}

function resetReviewState() {
  state.reviewStatus = "pending";
  state.checklist = state.checklist.map((item) => ({ ...item, done: false }));
}

function selectPacket(packetId) {
  state.selectedPacketId = packetId;
  state.selectedClaimIndex = 0;
  state.selectedFormat = "carousel";
  resetReviewState();
  renderAll();
}

document.addEventListener("click", (event) => {
  const packetButton = event.target.closest("[data-packet-id]");
  if (packetButton) {
    selectPacket(packetButton.dataset.packetId);
    return;
  }

  const claimButton = event.target.closest("[data-claim-index]");
  if (claimButton) {
    state.selectedClaimIndex = Number(claimButton.dataset.claimIndex);
    state.reviewStatus = "pending";
    renderClaims();
    renderClaimDetail();
    renderGateStatus();
    return;
  }

  const formatButton = event.target.closest("[data-format]");
  if (formatButton) {
    state.selectedFormat = formatButton.dataset.format;
    renderFormats();
    renderDraft();
    return;
  }
});

document.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-check-id]");
  if (!checkbox) {
    return;
  }

  state.checklist = state.checklist.map((item) => {
    if (item.id === checkbox.dataset.checkId) {
      return { ...item, done: checkbox.checked };
    }
    return item;
  });
  state.reviewStatus = "pending";
  renderChecklist();
  renderGateStatus();
});

document.getElementById("queue-question").addEventListener("click", () => {
  const input = document.getElementById("question-input");
  const question = input.value.trim();
  if (!question) {
    return;
  }
  state.queue.unshift(question);
  input.value = "";
  renderQueue();
});

document.getElementById("load-next-packet").addEventListener("click", () => {
  const currentIndex = packets.findIndex((packet) => packet.id === state.selectedPacketId);
  const nextPacket = packets[(currentIndex + 1) % packets.length];
  selectPacket(nextPacket.id);
});

document.getElementById("approve-review").addEventListener("click", () => {
  const allDone = state.checklist.every((item) => item.done);
  state.reviewStatus = allDone ? "approved" : "pending";
  renderGateStatus();
});

document.getElementById("request-revision").addEventListener("click", () => {
  state.reviewStatus = "revision";
  renderGateStatus();
});

renderAll();
