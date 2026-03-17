const { json, parseJsonBody, requireMethod, handleError } = require("./_lib/http");
const { queueQuestion } = require("./_lib/workspace-store");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "POST");
    const body = await parseJsonBody(event);
    const store = queueQuestion(body);
    return json(200, { workspace: store.workspace });
  } catch (error) {
    return handleError(error);
  }
};
