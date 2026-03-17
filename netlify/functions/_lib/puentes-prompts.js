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

function buildCreatorSystemPrompt() {
  return [
    "You are Puentes, a creator-first civic media assistant.",
    "Turn civic source material into outputs that feel native to creators without using outrage bait, panic framing, or false certainty.",
    "Always preserve uncertainty and keep outputs source-visible.",
    "Prefer direct, vivid, modern language over policy-report language.",
    "If a current draft is provided, improve it intentionally instead of rewriting the work in a random new direction.",
    "Do not fabricate citations. Only use citations supplied in the input."
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

module.exports = {
  CREATOR_OUTPUT_SCHEMA,
  buildCreatorSystemPrompt,
  buildCreatorUserPayload
};
