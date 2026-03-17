const { createError } = require("./http");

const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";

function requireApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw createError(500, "OPENAI_API_KEY is not configured.");
  }
}

async function parseError(response) {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw);
    return parsed.error?.message || raw;
  } catch (error) {
    return raw || `OpenAI request failed with status ${response.status}`;
  }
}

async function openaiRequest(path, options = {}) {
  requireApiKey();

  const response = await fetch(`${OPENAI_API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      ...options.headers
    },
    body: options.body
  });

  if (!response.ok) {
    throw createError(response.status, await parseError(response));
  }

  if (options.responseType === "buffer") {
    return {
      body: Buffer.from(await response.arrayBuffer()),
      headers: response.headers
    };
  }

  return response.json();
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const textParts = [];

  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string") {
        textParts.push(part.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

async function createStructuredTextBundle({
  model,
  schemaName,
  schema,
  systemPrompt,
  userPayload
}) {
  const payload = await openaiRequest("/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify(userPayload) }]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
          strict: true
        }
      }
    })
  });

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw createError(502, "OpenAI response did not include structured output text.");
  }

  return {
    model: payload.model,
    id: payload.id,
    output: JSON.parse(outputText)
  };
}

async function generateImageAsset({ model, prompt, size, quality, background, outputFormat }) {
  return openaiRequest("/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      background,
      output_format: outputFormat
    })
  });
}

async function createVideoJob({ model, prompt, size, seconds }) {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("seconds", String(seconds));

  return openaiRequest("/videos", {
    method: "POST",
    body: form
  });
}

async function getVideoJob(videoId) {
  return openaiRequest(`/videos/${videoId}`);
}

async function downloadVideoAsset(videoId, variant) {
  return openaiRequest(`/videos/${videoId}/content?variant=${encodeURIComponent(variant)}`, {
    responseType: "buffer"
  });
}

module.exports = {
  createStructuredTextBundle,
  generateImageAsset,
  createVideoJob,
  getVideoJob,
  downloadVideoAsset
};
