const workflowContent = {
  ingest: {
    kicker: "Input sources",
    title: "Gather civic material from places young people rarely have time to parse.",
    text: "Puentes ingests public documents, trusted reporting, and questions from communities or classrooms, then structures them into traceable source packets instead of a loose prompt history.",
    items: [
      "Public documents and institutional releases",
      "Reliable reporting and local context",
      "Community and classroom question intake"
    ]
  },
  verify: {
    kicker: "Claim verification",
    title: "Break claims into checkable pieces and retrieve evidence before drafting anything public.",
    text: "The system runs retrieval workflows to connect claims to supporting, conflicting, or uncertain evidence, keeping the provenance visible for every approved fact block.",
    items: [
      "Source-linked claim decomposition",
      "Evidence comparison across documents",
      "Uncertainty notes when support is incomplete"
    ]
  },
  analyze: {
    kicker: "Integrity analysis",
    title: "Detect manipulation patterns and polarization signals that distort understanding.",
    text: "Puentes reviews candidate language for emotional coercion, scapegoating, false binaries, and engagement bait, then annotates amplification risk before it reaches audiences.",
    items: [
      "Manipulative rhetoric flags",
      "Depolarizing reframing suggestions",
      "Algorithmic amplification risk notes"
    ]
  },
  publish: {
    kicker: "Human review",
    title: "Prepare usable media formats while preserving editorial control.",
    text: "Once facts and risk notes are stable, Puentes drafts explainers, scripts, and discussion prompts for humans to review, edit, and approve. Nothing is autopublished.",
    items: [
      "Short-video scripts and explainers",
      "Classroom and community discussion prompts",
      "Reviewer checklist for safety, tone, and omissions"
    ]
  }
};

const audienceContent = {
  youth: {
    kicker: "Youth-facing media",
    title: "Short, source-linked content that explains without flattening.",
    text: "Puentes can draft explainers, carousel slides, short-video scripts, and discussion prompts in language that respects young audiences without sounding institutional or patronizing.",
    items: [
      "Carousel outlines with citations",
      "Short-video scripts with narration beats",
      "Context cards for comments and group chats"
    ]
  },
  educators: {
    kicker: "Classroom tools",
    title: "Discussion material that turns controversy into inquiry instead of performance.",
    text: "Educators can use Puentes to create lesson starters, reading guides, role-based discussion prompts, and source packs that help students compare evidence and rhetoric.",
    items: [
      "Question sets tied to verified sources",
      "Facilitation prompts for balanced discussion",
      "Mini-briefs that explain why a topic is trending"
    ]
  },
  creators: {
    kicker: "Creator support",
    title: "Trusted community voices get faster civic workflows without losing rigor.",
    text: "Creators can move from issue intake to review-ready script drafts while retaining citations, risk flags, and language guidance that helps them avoid accidental amplification.",
    items: [
      "Video script structures with source notes",
      "Caption options with tone controls",
      "Review checklists for fairness and safety"
    ]
  }
};

function updatePanel(content, ids) {
  document.getElementById(ids.kicker).textContent = content.kicker;
  document.getElementById(ids.title).textContent = content.title;
  document.getElementById(ids.text).textContent = content.text;
  document.getElementById(ids.list).innerHTML = content.items.map((item) => `<li>${item}</li>`).join("");
}

document.querySelectorAll(".workflow-step").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".workflow-step").forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });
    updatePanel(workflowContent[button.dataset.step], {
      kicker: "detail-kicker",
      title: "detail-title",
      text: "detail-text",
      list: "detail-list"
    });
  });
});

document.querySelectorAll(".audience-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".audience-tab").forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });
    updatePanel(audienceContent[button.dataset.audience], {
      kicker: "audience-kicker",
      title: "audience-title",
      text: "audience-text",
      list: "audience-list"
    });
  });
});