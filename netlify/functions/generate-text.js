const { json, parseJsonBody, requireMethod, createError, handleError } = require("./_lib/http");
const { createStructuredTextBundle } = require("./_lib/openai");
const { getTaskConfig } = require("./_lib/puentes-prompts");
const { sanitizeModel } = require("../../lib/model-config");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "POST");
    const body = await parseJsonBody(event);
    const taskType = body.taskType || "creator_bundle";
    const taskConfig = getTaskConfig(taskType);

    if (!body.packetTitle && !body.packetSummary && !body.coreQuestion) {
      throw createError(400, "Provide at least packetTitle, packetSummary, or coreQuestion.");
    }

    const result = await createStructuredTextBundle({
      model: sanitizeModel("text", body.model),
      schemaName: taskConfig.schemaName,
      schema: taskConfig.schema,
      systemPrompt: taskConfig.systemPrompt,
      userPayload: taskConfig.userPayloadBuilder(body)
    });

    return json(200, result);
  } catch (error) {
    return handleError(error);
  }
};
