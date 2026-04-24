const { json, parseJsonBody, requireMethod, handleError } = require("./_lib/http");
const { requireAccess } = require("./_lib/access");
const { queueQuestion } = require("./_lib/workspace-store");

exports.handler = async function handler(event, context) {
  try {
    requireMethod(event, "POST");
    requireAccess(event, context, { scope: "mutation" });
    const body = await parseJsonBody(event);
    const store = queueQuestion(body);
    return json(200, { workspace: store.workspace });
  } catch (error) {
    return handleError(error);
  }
};
