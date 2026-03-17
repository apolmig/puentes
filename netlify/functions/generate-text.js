const { json, parseJsonBody, requireMethod, createError, handleError } = require("./_lib/http");
const { createStructuredTextBundle } = require("./_lib/openai");
const {
  CREATOR_OUTPUT_SCHEMA,
  buildCreatorSystemPrompt,
  buildCreatorUserPayload
} = require("./_lib/puentes-prompts");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "POST");
    const body = await parseJsonBody(event);

    if (!body.packetTitle && !body.packetSummary && !body.coreQuestion) {
      throw createError(400, "Provide at least packetTitle, packetSummary, or coreQuestion.");
    }

    const result = await createStructuredTextBundle({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5",
      schemaName: "puentes_creator_output",
      schema: CREATOR_OUTPUT_SCHEMA,
      systemPrompt: buildCreatorSystemPrompt(),
      userPayload: buildCreatorUserPayload(body)
    });

    return json(200, result);
  } catch (error) {
    return handleError(error);
  }
};
