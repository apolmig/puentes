const { json, parseJsonBody, requireMethod, createError, handleError } = require("./_lib/http");
const { requireAccess } = require("./_lib/access");
const { createStructuredTextBundle } = require("./_lib/openai");
const {
  REVIEW_FINDINGS_SCHEMA,
  buildReviewSystemPrompt,
  buildReviewUserPayload
} = require("./_lib/puentes-prompts");
const { sanitizeModel } = require("../../lib/model-config");

exports.handler = async function handler(event, context) {
  try {
    requireMethod(event, "POST");
    requireAccess(event, context, { scope: "ai" });
    const body = await parseJsonBody(event);

    if (!body.draft || typeof body.draft !== "object") {
      throw createError(400, "Draft payload is required.");
    }

    const result = await createStructuredTextBundle({
      model: sanitizeModel("review", body.model),
      schemaName: "puentes_review_findings",
      schema: REVIEW_FINDINGS_SCHEMA,
      systemPrompt: buildReviewSystemPrompt(),
      userPayload: buildReviewUserPayload(body)
    });

    return json(200, result);
  } catch (error) {
    return handleError(error);
  }
};
