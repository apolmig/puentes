const DEFAULT_MODELS = {
  text: ["gpt-5", "gpt-5-mini"],
  review: ["gpt-5-mini", "gpt-5"],
  image: ["gpt-image-1.5"],
  video: ["sora-2"]
};

const DEFAULTS = {
  text: process.env.PUENTES_TEXT_MODEL || process.env.OPENAI_TEXT_MODEL || DEFAULT_MODELS.text[0],
  review: process.env.PUENTES_REVIEW_MODEL || process.env.PUENTES_TEXT_MODEL || process.env.OPENAI_TEXT_MODEL || DEFAULT_MODELS.review[0],
  image: process.env.PUENTES_IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODELS.image[0],
  video: process.env.PUENTES_VIDEO_MODEL || process.env.OPENAI_VIDEO_MODEL || DEFAULT_MODELS.video[0]
};

function parseModelList(value, fallback) {
  const parsed = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length ? [...new Set(parsed)] : fallback.slice();
}

function getCapabilityConfig(capability) {
  const defaults = DEFAULT_MODELS[capability] || [];
  const envKey = `PUENTES_${capability.toUpperCase()}_MODELS`;
  const models = parseModelList(process.env[envKey], defaults);
  const selected = models.includes(DEFAULTS[capability]) ? DEFAULTS[capability] : models[0] || "";

  return {
    provider: "openai",
    selectedModel: selected,
    availableModels: models
  };
}

function getPublicAiConfig() {
  return {
    text: getCapabilityConfig("text"),
    review: getCapabilityConfig("review"),
    image: getCapabilityConfig("image"),
    video: getCapabilityConfig("video"),
    apiKeysConfigured: {
      openai: Boolean(process.env.OPENAI_API_KEY)
    }
  };
}

function sanitizeModel(capability, requestedModel) {
  const config = getCapabilityConfig(capability);
  if (typeof requestedModel === "string" && config.availableModels.includes(requestedModel)) {
    return requestedModel;
  }
  return config.selectedModel;
}

module.exports = {
  getPublicAiConfig,
  sanitizeModel
};
