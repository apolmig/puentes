const INTAKE_BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "peopleThink", "recordSays", "missing", "recommendedPacketId", "recommendedClaimIndex"],
  properties: {
    summary: { type: "string" },
    peopleThink: { type: "string" },
    recordSays: { type: "string" },
    missing: { type: "string" },
    recommendedPacketId: { type: "string" },
    recommendedClaimIndex: { type: "integer" }
  }
};

const CLAIM_MAP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["framing", "supportedPoints", "openQuestions", "languageRisks"],
  properties: {
    framing: { type: "string" },
    supportedPoints: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" }
    },
    openQuestions: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" }
    },
    languageRisks: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" }
    }
  }
};

const ANGLE_OPTIONS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["angles"],
  properties: {
    angles: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "hook", "audienceFit", "riskNote", "avoidWhen"],
        properties: {
          label: { type: "string" },
          hook: { type: "string" },
          audienceFit: { type: "string" },
          riskNote: { type: "string" },
          avoidWhen: { type: "string" }
        }
      }
    }
  }
};

const CREATOR_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "hook",
    "caption",
    "script",
    "slides",
    "commentPrompt",
    "citations",
    "visualBrief",
    "videoBrief",
    "safetyNotes"
  ],
  properties: {
    title: { type: "string" },
    hook: { type: "string" },
    caption: { type: "string" },
    script: { type: "string" },
    slides: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string" }
    },
    commentPrompt: { type: "string" },
    citations: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string" }
    },
    visualBrief: { type: "string" },
    videoBrief: { type: "string" },
    safetyNotes: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" }
    }
  }
};

const REVIEW_FINDINGS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "summary", "strengths", "risks", "fixes"],
  properties: {
    verdict: { type: "string" },
    summary: { type: "string" },
    strengths: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" }
    },
    risks: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" }
    },
    fixes: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" }
    }
  }
};

function baseSystemPrompt() {
  return [
    "You are Puentes, a creator-first civic media assistant.",
    "Your job is to produce source-linked civic outputs without panic framing, scapegoating, false binaries, or fabricated certainty.",
    "Keep uncertainty visible when the packet does not support a confident conclusion.",
    "Only rely on evidence, citations, and context supplied in the input.",
    "Never invent citations, sources, or facts."
  ].join(" ");
}

function buildTaskSystemPrompt(taskType) {
  const base = baseSystemPrompt();

  if (taskType === "intake_brief") {
    return `${base} Produce an intake triage brief that separates rumor pressure from the actual record and what is still missing.`;
  }

  if (taskType === "claim_map") {
    return `${base} Produce a verification map for the selected claim that helps a human reviewer see supported points, open questions, and language risks before drafting.`;
  }

  if (taskType === "angle_options") {
    return `${base} Produce three clearly different creator-safe editorial angles for the same packet and claim. Each angle must stay source-linked, avoid panic framing, and help a creator decide how to package the story.`;
  }

  return `${base} Produce a creator-ready draft bundle that feels feed-native while staying grounded in the packet.`;
}

function buildReviewSystemPrompt() {
  return [
    baseSystemPrompt(),
    "You are acting as an internal review copilot before human approval.",
    "Check for citation visibility, certainty drift, manipulative framing, and audience fit.",
    "Return concrete fixes, not vague warnings.",
    "Approval remains human-only."
  ].join(" ");
}

function buildCreatorUserPayload(body) {
  const customInstructions = Array.isArray(body.instructions)
    ? body.instructions.filter((instruction) => typeof instruction === "string" && instruction.trim()).slice(0, 6)
    : [];

  return {
    audience: body.audience || "creator",
    goal: body.goal || "Create a trustworthy civic explainer for a short-form creator audience.",
    format: body.format || "creator",
    packetTitle: body.packetTitle || "",
    packetSummary: body.packetSummary || "",
    coreQuestion: body.coreQuestion || "",
    claim: body.claim || "",
    evidence: body.evidence || "",
    gaps: body.gaps || "",
    citations: Array.isArray(body.citations) ? body.citations : [],
    manipulationSignals: Array.isArray(body.manipulationSignals) ? body.manipulationSignals : [],
    additionalContext: body.additionalContext || "",
    currentDraft: body.currentDraft && typeof body.currentDraft === "object" ? body.currentDraft : {},
    instructions: [
      "Return a creator-ready package.",
      "Keep the hook and caption natural, not institutional.",
      "Make the script concise and easy to narrate.",
      "Slides should be swipe-friendly and source-aware.",
      "Visual brief should guide an image or cover concept.",
      "Video brief should guide a short explainer clip.",
      ...customInstructions
    ]
  };
}

function buildIntakeUserPayload(body) {
  return {
    packetTitle: body.packetTitle || "",
    packetSummary: body.packetSummary || "",
    coreQuestion: body.coreQuestion || "",
    claim: body.claim || "",
    evidence: body.evidence || "",
    gaps: body.gaps || "",
    packetId: body.packetId || "",
    claimIndex: Number.isInteger(body.claimIndex) ? body.claimIndex : 0,
    citations: Array.isArray(body.citations) ? body.citations : [],
    manipulationSignals: Array.isArray(body.manipulationSignals) ? body.manipulationSignals : [],
    audience: body.audience || "creator"
  };
}

function buildClaimMapUserPayload(body) {
  return {
    packetTitle: body.packetTitle || "",
    packetSummary: body.packetSummary || "",
    claim: body.claim || "",
    evidence: body.evidence || "",
    gaps: body.gaps || "",
    citations: Array.isArray(body.citations) ? body.citations : [],
    manipulationSignals: Array.isArray(body.manipulationSignals) ? body.manipulationSignals : [],
    audience: body.audience || "creator",
    format: body.format || "creator"
  };
}

function buildAngleOptionsUserPayload(body) {
  return {
    audience: body.audience || "creator",
    format: body.format || "creator",
    packetTitle: body.packetTitle || "",
    packetSummary: body.packetSummary || "",
    coreQuestion: body.coreQuestion || "",
    claim: body.claim || "",
    evidence: body.evidence || "",
    gaps: body.gaps || "",
    citations: Array.isArray(body.citations) ? body.citations : [],
    manipulationSignals: Array.isArray(body.manipulationSignals) ? body.manipulationSignals : [],
    packagingPreset: body.packagingPreset || "fast_myth_check"
  };
}

function buildReviewUserPayload(body) {
  return {
    audience: body.audience || "creator",
    format: body.format || "creator",
    packetTitle: body.packetTitle || "",
    packetSummary: body.packetSummary || "",
    claim: body.claim || "",
    citations: Array.isArray(body.citations) ? body.citations : [],
    manipulationSignals: Array.isArray(body.manipulationSignals) ? body.manipulationSignals : [],
    draft: body.draft && typeof body.draft === "object" ? body.draft : {}
  };
}

function getTaskConfig(taskType) {
  if (taskType === "intake_brief") {
    return {
      schemaName: "puentes_intake_brief",
      schema: INTAKE_BRIEF_SCHEMA,
      systemPrompt: buildTaskSystemPrompt(taskType),
      userPayloadBuilder: buildIntakeUserPayload
    };
  }

  if (taskType === "claim_map") {
    return {
      schemaName: "puentes_claim_map",
      schema: CLAIM_MAP_SCHEMA,
      systemPrompt: buildTaskSystemPrompt(taskType),
      userPayloadBuilder: buildClaimMapUserPayload
    };
  }

  if (taskType === "angle_options") {
    return {
      schemaName: "puentes_angle_options",
      schema: ANGLE_OPTIONS_SCHEMA,
      systemPrompt: buildTaskSystemPrompt(taskType),
      userPayloadBuilder: buildAngleOptionsUserPayload
    };
  }

  return {
    schemaName: "puentes_creator_output",
    schema: CREATOR_OUTPUT_SCHEMA,
    systemPrompt: buildTaskSystemPrompt(taskType),
    userPayloadBuilder: buildCreatorUserPayload
  };
}

module.exports = {
  CREATOR_OUTPUT_SCHEMA,
  REVIEW_FINDINGS_SCHEMA,
  getTaskConfig,
  buildReviewSystemPrompt,
  buildReviewUserPayload
};
