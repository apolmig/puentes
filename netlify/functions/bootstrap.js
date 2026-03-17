const { json, requireMethod, handleError } = require("./_lib/http");
const { loadStore, useFileStore } = require("./_lib/workspace-store");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "GET");
    return json(200, {
      ...loadStore(),
      backend: {
        mode: useFileStore() ? "file" : "seed"
      }
    });
  } catch (error) {
    return handleError(error);
  }
};
