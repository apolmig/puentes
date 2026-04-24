(function (root, factory) {
  const data = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = data;
  }

  root.PUENTES_STATIC_DATA = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
const baseChecklist = [
  { id: "sources", label: "Sources checked and kept visible.", done: false },
  { id: "tone", label: "Tone fits the audience and stays nonpartisan.", done: false },
  { id: "risks", label: "Manipulation and amplification risks reviewed.", done: false }
];

const seedTimestamp = "2026-03-16T20:00:00.000Z";
const defaultAiSettings = {
  textModel: "gpt-5",
  reviewModel: "gpt-5-mini",
  imageModel: "gpt-image-1.5",
  videoModel: "sora-2"
};

const audiences = [
  {
    id: "student",
    label: "Student",
    kicker: "Student mode",
    title: "Fast clarity for a feed-native class discussion",
    summary: "Plain language, fewer terms, one question people can actually discuss.",
    focus: [
      "Define civic terms once",
      "Lead with what changed",
      "End with one real discussion question"
    ],
    questionPlaceholder: "Example: Everyone is reposting this claim. What is actually true, and what is just noise?",
    defaultFormat: "carousel",
    draftRule: "Keep it simple, visible, and classroom-safe."
  },
  {
    id: "creator",
    label: "Creator",
    kicker: "Creator mode",
    title: "For trusted creators who need a clean handoff",
    summary: "Hooks, captions, and pacing that feel native without sounding like outrage.",
    focus: [
      "Use a natural hook",
      "Keep every claim source-linked",
      "Leave room for comments without farming conflict"
    ],
    questionPlaceholder: "Example: I need a 30-second explainer that feels native but keeps the receipts. What's the clean version?",
    defaultFormat: "creator",
    draftRule: "Sound human, not hype-driven."
  },
  {
    id: "educator",
    label: "Educator",
    kicker: "Educator mode",
    title: "For classrooms, clubs, and guided discussion",
    summary: "Context, prompts, and framing for constructive conversation.",
    focus: [
      "Surface what is known and missing",
      "Turn claims into discussion-ready questions",
      "Keep the tone grounded for mixed groups"
    ],
    questionPlaceholder: "Example: I need a classroom-safe explainer and a few prompts to compare evidence.",
    defaultFormat: "classroom",
    draftRule: "Stay calm, clear, and easy to facilitate."
  }
];

const rawPackets = [
  {
    id: "housing",
    label: "Housing vote packet",
    shortLabel: "Housing",
    type: "City docs + reporting",
    date: "Updated Mar 16",
    trust: "Mixed public record",
    summary: "City notes, reporting, and youth questions about a housing vote getting flattened into team-sport clips.",
    question: "What actually changed in the vote, and which clips are missing the real context?",
    sources: [
      "Council agenda and amendment notes",
      "Local reporting on zoning and tenant protections",
      "Youth workshop questions"
    ],
    amplification: "Clips are amplifying the council fight more than the policy details, so the conflict is outrunning the facts.",
    manipulation: [
      "False binary: pro-housing or anti-neighborhood",
      "Scapegoating aimed at renters and migrants",
      "Outrage clips detached from amendment context"
    ],
    artDirection: "Warm civic print with bold orange highlights",
    vibeLabel: "Feed conflict",
    thumbnailTheme: "Council screenshot with red callouts",
    creatorArchetype: "Explainer creator",
    feed: {
      platform: "TikTok / Reels / Shorts",
      spreadPattern: "Quote clip + comment-war stitch loop",
      detectorLabel: "Out-of-context policy clip",
      spreadHeat: "high",
      correctionMode: "Myth-check video",
      trendTags: [
        "housing vote",
        "tenant protections",
        "stitch bait"
      ],
      hookSeed: "This clip is real, but the part that changes the story is missing."
    },
    claims: [
      {
        title: "The vote removed all tenant protections.",
        status: "unclear",
        summary: "Some tenant rules changed, but the record does not support 'all protections gone.'",
        evidence: "Notice requirements stayed; affordability thresholds changed in two zones.",
        gap: "Implementation memo still missing, so enforcement impact is unclear.",
        citations: [
          "Council amendment tracker section 4",
          "Local newsroom explainer paragraph on tenant notice"
        ],
        signals: [
          "All-or-none language overstates the record",
          "Eviction imagery is being paired with unrelated policy edits"
        ]
      },
      {
        title: "The measure only benefits developers.",
        status: "mixed",
        summary: "Developers gain buildability, but affordability and permit rules still shape the outcome.",
        evidence: "Density bonuses are tied to affordability targets and transit-access rules.",
        gap: "Long-term impact depends on enforcement and market behavior.",
        citations: [
          "City summary on density bonuses",
          "Reporter interview with housing researchers"
        ],
        signals: [
          "Villain language narrows discussion",
          "Memes collapse policy tradeoffs into personal motive"
        ]
      },
      {
        title: "Young renters want plain-language comparisons, not slogans.",
        status: "supported",
        summary: "Intake notes keep asking for side-by-side comparisons and simpler terms.",
        evidence: "Workshop notes ask for plain comparisons of zoning and affordability bands.",
        gap: "The sample is narrow, so treat it as directional.",
        citations: [
          "Workshop intake sheet",
          "Mentor debrief summary"
        ],
        signals: [
          "Useful reset from slogans to concrete changes",
          "Keep the language direct, not patronizing"
        ]
      }
    ],
    drafts: {
      carousel: {
        kicker: "Carousel pack",
        title: "Housing vote: what changed, what didn't, what is still unclear",
        summary: "Lead with the real change, keep the caveats visible, and skip fake certainty.",
        points: [
          "Slide 1: People are saying the vote changed everything. The record is more specific.",
          "Slide 2: Show the two edits that actually happened.",
          "Slide 3: Name one protection that stayed in place.",
          "Slide 4: Flag what is still unknown.",
          "Slide 5: Close with sources and one question."
        ],
        note: "Keep each slide tied to a line in the record."
      },
      video: {
        kicker: "Short video script",
        title: "Housing vote: a 45-second myth check",
        summary: "Open with the viral claim, correct it fast, and leave one open question.",
        points: [
          "Hook: People are saying the vote killed every tenant protection. That is not what the packet shows.",
          "Beat 2: Show the two policy edits that actually happened.",
          "Beat 3: Name one protection that stayed and one open question.",
          "Close: Point viewers to the source list."
        ],
        note: "Use only clips that add context."
      },
      classroom: {
        kicker: "Class prompts",
        title: "How do housing debates get flattened online?",
        summary: "Separate record, reaction, and what is still missing.",
        points: [
          "Which claim is strongest, and what source supports it?",
          "Where do you see a false binary?",
          "What is still missing before you decide?"
        ],
        note: "Prompt inquiry, not alignment."
      },
      creator: {
        kicker: "Creator caption",
        title: "Low-drama caption and comment prompt",
        summary: "Feed-native, source-linked, and calm.",
        points: [
          "Caption opener: Quick reset - the vote changed some rules, but not all of them.",
          "Middle line: Here is what changed, what stayed, and what is still unresolved.",
          "Comment prompt: What gets distorted fastest when this hits the feed?",
          "End line: Sources are in the caption notes."
        ],
        note: "Help the creator sound grounded, not forced."
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
    summary: "A regional transit budget debate where screenshots are spreading faster than the route notes.",
    question: "How should young riders understand route cuts and expansions without getting pulled into culture-war framing?",
    sources: [
      "Draft budget tables",
      "Service equity memo",
      "Reporting on rider impact and public comment"
    ],
    amplification: "Map screenshots are driving the conversation without the budget notes behind them.",
    manipulation: [
      "Selective screenshots hide route additions",
      "Operational choices are framed as betrayal",
      "Anger travels faster than comparison"
    ],
    artDirection: "Transit-map blues with hard white overlays",
    vibeLabel: "Screenshot panic",
    thumbnailTheme: "Route map with cut lines highlighted",
    creatorArchetype: "Rider explainer",
    feed: {
      platform: "TikTok / Reels / Shorts",
      spreadPattern: "Screenshot post + route-map reaction loop",
      detectorLabel: "Selective screenshot distortion",
      spreadHeat: "high",
      correctionMode: "Context carousel",
      trendTags: [
        "route cuts",
        "student commute",
        "screenshot loop"
      ],
      hookSeed: "The screenshot is real, but it leaves out the service table that changes the read."
    },
    claims: [
      {
        title: "The budget cuts youth access across the board.",
        status: "mixed",
        summary: "Some riders lose direct routes, but other corridors gain frequency.",
        evidence: "Service drops on two lines while three overlapping corridors get more frequency.",
        gap: "Travel-time estimates are still missing for every neighborhood.",
        citations: [
          "Draft budget service table",
          "Equity memo on corridor frequency"
        ],
        signals: [
          "Across-the-board language hides uneven impacts",
          "Maps can imply universal loss when the record is mixed"
        ]
      },
      {
        title: "The agency ignored public comment entirely.",
        status: "unclear",
        summary: "Comments were logged and cited, but the final impact is still unclear.",
        evidence: "The packet references student commute concerns and weekend access issues.",
        gap: "The revised final budget has not been released.",
        citations: [
          "Board packet appendix on public comments",
          "Reporter notes from committee hearing"
        ],
        signals: [
          "Ignored entirely flattens partial responsiveness",
          "Frustrated testimony is circulating without replies"
        ]
      },
      {
        title: "Young riders want route-by-route explanations, not a spreadsheet dump.",
        status: "supported",
        summary: "Community intake shows demand for simpler route explainers.",
        evidence: "Youth groups ask about commute impact, weekend jobs, and actual alternatives.",
        gap: "A clearer rider-facing explainer still needs to be made.",
        citations: [
          "Youth transport clinic notes",
          "Teacher feedback summary"
        ],
        signals: [
          "Reframe the tables into practical rider impact",
          "Use plain language about time, access, and reliability"
        ]
      }
    ],
    drafts: {
      carousel: {
        kicker: "Carousel pack",
        title: "Transit budget: 4 quick cards",
        summary: "Translate the budget into rider impact, show who gains or loses frequency, and flag what is pending.",
        points: [
          "Card 1: This screenshot is real, but it is not the full story.",
          "Card 2: Name the two biggest cuts.",
          "Card 3: Show the frequency increases students should know.",
          "Card 4: End with what could still change."
        ],
        note: "Anchor each route claim to the budget table."
      },
      video: {
        kicker: "Short video script",
        title: "A 30-second map myth check",
        summary: "Open with the screenshot, then widen the frame with the missing service data.",
        points: [
          "Hook: This map screenshot is real, but it leaves out the service changes around it.",
          "Beat 2: Show one route loss and one frequency gain.",
          "Beat 3: Explain what riders still need from the vote.",
          "Close: Tell viewers where the route table lives."
        ],
        note: "Do not crop the evidence into the same lie."
      },
      classroom: {
        kicker: "Class prompts",
        title: "How do budget decisions become feed stories?",
        summary: "Compare technical evidence with platform framing.",
        points: [
          "Which post feels most persuasive before checking sources?",
          "What data point changed your first impression?",
          "How would you explain it from one screenshot?"
        ],
        note: "Keep the discussion centered on evidence and framing."
      },
      creator: {
        kicker: "Creator caption",
        title: "Caption structure for a transit explainer",
        summary: "Open with the screenshot people saw, then add the missing context.",
        points: [
          "Caption opener: People are posting this map like it tells the whole story. It does not.",
          "Middle line: Some riders lose direct service, but other corridors gain frequency.",
          "Comment prompt: What route detail would help you understand the tradeoff faster?",
          "End line: Sources are linked so riders can compare the map to the notes."
        ],
        note: "Keep the tone practical and rider-first."
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
    summary: "A school board discussion where reaction clips are outrunning the FAQ and process notes.",
    question: "How can Puentes help educators and youth creators explain the policy without becoming another outrage page?",
    sources: [
      "Board agenda and public FAQ",
      "Local education reporting",
      "Questions from mentors and teachers"
    ],
    amplification: "Algorithmic spread favors identity-conflict clips over the FAQ and classroom guidance.",
    manipulation: [
      "Culture-war labels replace policy language",
      "Selective quotes strip procedural context",
      "Creators feel pressure to sound certain"
    ],
    artDirection: "Paper notices with sharp black type and red flags",
    vibeLabel: "Process spiral",
    thumbnailTheme: "FAQ page with reaction overlays",
    creatorArchetype: "Teacher-safe explainer",
    feed: {
      platform: "TikTok / Reels / Shorts",
      spreadPattern: "Panic clip + policy wording flattening",
      detectorLabel: "Procedural rumor spiral",
      spreadHeat: "medium",
      correctionMode: "Teacher-safe explainer",
      trendTags: [
        "school board",
        "FAQ",
        "process explainer"
      ],
      hookSeed: "The rumor sounds bigger than the record, so the process needs to come first."
    },
    claims: [
      {
        title: "The board banned civic discussion materials.",
        status: "unclear",
        summary: "The packet shows review rules, but not a blanket ban on civic materials.",
        evidence: "The agenda focuses on review, notification, and approved resource lists.",
        gap: "Teachers are still waiting for the implementation memo.",
        citations: [
          "Board agenda item on instructional review",
          "FAQ on classroom resources"
        ],
        signals: [
          "Ban language compresses a procedural issue",
          "Reaction posts skip the FAQ"
        ]
      },
      {
        title: "Educators want a transparent process and fewer rumor cycles.",
        status: "supported",
        summary: "Teachers and mentors want clearer process explanations.",
        evidence: "Community notes ask for short explainers, appeal timelines, and decision examples.",
        gap: "The board has not yet published a youth-facing template.",
        citations: [
          "Teacher roundtable notes",
          "Mentor debrief on family questions"
        ],
        signals: [
          "Explain process before debate",
          "Keep wording concrete"
        ]
      },
      {
        title: "Creators are being pushed toward hot takes instead of source-linked explainers.",
        status: "supported",
        summary: "Speed and platform pressure make nuanced civic explainers harder to publish.",
        evidence: "Creators say reaction content outperforms citation-heavy explainers.",
        gap: "The packet is anecdotal and does not quantify the effect.",
        citations: [
          "Creator feedback interviews",
          "Youth media mentor notes"
        ],
        signals: [
          "Need faster rigor, not faster outrage",
          "Acknowledge uncertainty without losing clarity"
        ]
      }
    ],
    drafts: {
      carousel: {
        kicker: "Carousel pack",
        title: "School board update in plain language",
        summary: "Explain the procedural change first, then separate facts from rumor.",
        points: [
          "Card 1: People are calling this a ban. The record says something narrower.",
          "Card 2: Define the procedural change in one sentence.",
          "Card 3: Show what is documented and what still depends on implementation.",
          "Card 4: End with how families can follow updates."
        ],
        note: "Preserve citations so people can point back to the record."
      },
      video: {
        kicker: "Short video script",
        title: "Process before panic: a 40-second recap",
        summary: "Open with the rumor, correct it with the record, and say what to watch next.",
        points: [
          "Hook: People are calling this a ban. The packet shows something more procedural.",
          "Beat 2: Show the two changes that are documented.",
          "Beat 3: Name the implementation memo as the next thing to watch.",
          "Close: Point viewers to the FAQ and notes."
        ],
        note: "Keep the tone calm and source-led."
      },
      classroom: {
        kicker: "Class prompts",
        title: "How do procedural issues become polarized online?",
        summary: "Compare official docs, reporting, and creator pressure.",
        points: [
          "Which term carries more emotion than evidence?",
          "What source clarified rumor vs record?",
          "How should creators communicate uncertainty?"
        ],
        note: "Frame the discussion around media literacy and trust."
      },
      creator: {
        kicker: "Creator caption",
        title: "Caption handoff for a school board explainer",
        summary: "Keep the opening familiar while resisting panic framing.",
        points: [
          "Caption opener: Quick context before this becomes another rumor spiral - the board changed review procedures, not everything people are claiming.",
          "Middle line: Here is what is documented, what is still unclear, and what to watch next.",
          "Comment prompt: What is hardest about explaining school policy without a culture-war fight?",
          "End line: Sources are attached so this stays grounded."
        ],
        note: "Sound human and familiar without borrowing outrage framing."
      }
    }
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(items) {
  return [...new Set(items)];
}

function cleanLead(text) {
  return String(text)
    .replace(/^(Slide|Card|Beat)\s*\d+\s*hook:\s*/i, "")
    .replace(/^(Slide|Card|Beat)\s*\d+:\s*/i, "")
    .replace(/^(Hook|Close|Middle line|End line|Caption opener|Comment prompt):\s*/i, "")
    .trim();
}

function extractHook(points, fallback) {
  const hookPoint = points.find((point) => /(hook:|caption opener:)/i.test(point)) || points[0];
  return cleanLead(hookPoint || fallback);
}

function extractCommentPrompt(points, fallback) {
  const commentLine = points.find((point) => /comment prompt:/i.test(point));
  return cleanLead(commentLine || fallback);
}

function buildCaption(format, draft, packet) {
  if (format === "creator") {
    return draft.points.map(cleanLead).join(" ");
  }

  if (format === "video") {
    return `${cleanLead(draft.points[0])} ${cleanLead(draft.points[draft.points.length - 1])} Sources stay attached in the handoff.`;
  }

  if (format === "classroom") {
    return `${draft.title}. Use these prompts to compare evidence, not just reactions.`;
  }

  return `${cleanLead(draft.points[0])} ${cleanLead(draft.points[draft.points.length - 1])} ${packet.question}`;
}

function collectCitations(packet) {
  return unique(packet.claims.flatMap((claim) => claim.citations)).slice(0, 4);
}

function buildClaimDetector(claim, packet) {
  const confidenceBand = claim.status === "supported"
    ? "High confidence"
    : claim.status === "mixed"
      ? "Medium confidence"
      : "Low confidence";
  const riskToAudience = claim.status === "supported"
    ? "Moderate risk of oversimplification if clips remove the nuance."
    : "High risk of false certainty if the hottest framing wins.";
  const spreadScore = claim.status === "supported"
    ? 66
    : claim.status === "mixed"
      ? 79
      : 91;
  const evidenceScore = claim.status === "supported"
    ? 88
    : claim.status === "mixed"
      ? 64
      : 47;

  return {
    confidenceBand,
    riskToAudience,
    missingContextType: claim.gap,
    deceptionPatterns: unique([
      ...(claim.signals || []).slice(0, 2),
      packet.feed?.spreadPattern || ""
    ]).filter(Boolean).slice(0, 4),
    viewerBelief: claim.title,
    recordSays: claim.summary,
    spreadScore,
    evidenceScore,
    responseMode: packet.feed?.correctionMode || "Myth-check video"
  };
}

function buildOutputBundle(packet, format, draft) {
  return {
    label: draft.kicker,
    title: draft.title,
    hook: extractHook(draft.points, draft.summary),
    script: draft.points.map(cleanLead).join(" "),
    slides: draft.points.map(cleanLead),
    caption: buildCaption(format, draft, packet),
    commentPrompt: extractCommentPrompt(draft.points, packet.question),
    citations: collectCitations(packet),
    shareSummary: `${packet.shortLabel}: ${draft.summary}`,
    note: draft.note
  };
}

const packets = rawPackets.map((packet) => ({
  ...packet,
  claims: packet.claims.map((claim) => ({
    ...claim,
    detector: claim.detector || buildClaimDetector(claim, packet)
  })),
  outputBundles: Object.fromEntries(
    Object.entries(packet.drafts).map(([format, draft]) => [format, buildOutputBundle(packet, format, draft)])
  )
}));

const audienceDefaults = Object.fromEntries(audiences.map((audience) => [audience.id, audience.defaultFormat]));

function buildChecklistState(checklist = []) {
  const overrides = new Map(
    Array.isArray(checklist)
      ? checklist.map((item) => [item.id, Boolean(item.done)])
      : []
  );

  return clone(baseChecklist).map((item) => ({
    ...item,
    done: overrides.has(item.id) ? overrides.get(item.id) : false
  }));
}

function createInitialHistory(packetId) {
  const packet = packets.find((candidate) => candidate.id === packetId);
  return [
    {
      id: `${packetId}-ready`,
      timestamp: seedTimestamp,
      action: "Workspace ready",
      detail: `${packet ? packet.label : packetId} is ready for creator handoff.`
    }
  ];
}

function createWorkspaceState(packetId, overrides = {}) {
  const packet = packets.find((candidate) => candidate.id === packetId);
  const audienceId = audienceDefaults[overrides.selectedAudienceId] ? overrides.selectedAudienceId : "creator";
  const format = packet && packet.outputBundles[overrides.selectedFormat]
    ? overrides.selectedFormat
    : audienceDefaults[audienceId];
  const selectedClaimIndex = Number.isInteger(overrides.selectedClaimIndex)
    ? Math.max(0, Math.min(overrides.selectedClaimIndex, (packet?.claims.length || 1) - 1))
    : 0;
  const history = Array.isArray(overrides.history) && overrides.history.length
    ? overrides.history
    : createInitialHistory(packetId);
  const aiSettings = overrides.aiSettings && typeof overrides.aiSettings === "object"
    ? overrides.aiSettings
    : {};

  return {
    selectedAudienceId: audienceId,
    selectedClaimIndex,
    selectedFormat: format,
    reviewStatus: ["pending", "approved", "revision"].includes(overrides.reviewStatus)
      ? overrides.reviewStatus
      : "pending",
    checklist: buildChecklistState(overrides.checklist),
    reviewerNotes: typeof overrides.reviewerNotes === "string" ? overrides.reviewerNotes : "",
    history,
    exportedFormats: Array.isArray(overrides.exportedFormats)
      ? unique(overrides.exportedFormats).filter((candidate) => packet && packet.outputBundles[candidate])
      : [],
    shareReady: Boolean(overrides.shareReady),
    shareUrl: typeof overrides.shareUrl === "string" ? overrides.shareUrl : "",
    packagingPreset: typeof overrides.packagingPreset === "string" ? overrides.packagingPreset : "fast_myth_check",
    generatedBundlesByFormat: overrides.generatedBundlesByFormat && typeof overrides.generatedBundlesByFormat === "object"
      ? clone(overrides.generatedBundlesByFormat)
      : {},
    generatedImagesByFormat: overrides.generatedImagesByFormat && typeof overrides.generatedImagesByFormat === "object"
      ? clone(overrides.generatedImagesByFormat)
      : {},
    generatedVideosByFormat: overrides.generatedVideosByFormat && typeof overrides.generatedVideosByFormat === "object"
      ? clone(overrides.generatedVideosByFormat)
      : {},
    aiSettings: {
      textModel: typeof aiSettings.textModel === "string" ? aiSettings.textModel : defaultAiSettings.textModel,
      reviewModel: typeof aiSettings.reviewModel === "string" ? aiSettings.reviewModel : defaultAiSettings.reviewModel,
      imageModel: typeof aiSettings.imageModel === "string" ? aiSettings.imageModel : defaultAiSettings.imageModel,
      videoModel: typeof aiSettings.videoModel === "string" ? aiSettings.videoModel : defaultAiSettings.videoModel
    },
    intakeBrief: overrides.intakeBrief && typeof overrides.intakeBrief === "object" ? clone(overrides.intakeBrief) : null,
    claimMap: overrides.claimMap && typeof overrides.claimMap === "object" ? clone(overrides.claimMap) : null,
    angleOptions: Array.isArray(overrides.angleOptions) ? clone(overrides.angleOptions).slice(0, 3) : [],
    selectedAngleIndex: Number.isInteger(overrides.selectedAngleIndex) ? Math.max(0, overrides.selectedAngleIndex) : 0,
    reviewFindings: overrides.reviewFindings && typeof overrides.reviewFindings === "object" ? clone(overrides.reviewFindings) : null,
    generationRuns: Array.isArray(overrides.generationRuns) ? clone(overrides.generationRuns).slice(0, 24) : []
  };
}

const workspaceStateByPacket = Object.fromEntries(
  packets.map((packet) => [packet.id, createWorkspaceState(packet.id)])
);

workspaceStateByPacket.housing = createWorkspaceState("housing", {
  history: [
    {
      id: "boot-1",
      timestamp: seedTimestamp,
      action: "Loaded sample workspace",
      detail: "Creator mode with the housing packet is ready for review and export."
    }
  ]
});

return {
  meta: { version: 3 },
  audiences,
  packets,
  workspace: {
    activePacketId: "housing",
    queue: [
      "People keep saying the housing vote changed everything. What actually changed?",
      "Can we get a short transit explainer that works for student riders and does not sound like a press release?"
    ],
    workspaceStateByPacket,
    lastSavedAt: seedTimestamp
  },
  baseChecklist,
  createWorkspaceState
};
});
