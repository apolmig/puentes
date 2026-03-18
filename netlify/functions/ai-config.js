const { json, requireMethod, handleError } = require("./_lib/http");
const { getPublicAiConfig } = require("../../lib/model-config");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "GET");
    return json(200, getPublicAiConfig());
  } catch (error) {
    return handleError(error);
  }
};
