function createError(statusCode, message, extras = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extras);
  return error;
}

function json(statusCode, payload, headers = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    },
    body: JSON.stringify(payload)
  };
}

function text(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    },
    body
  };
}

function noContent(statusCode = 204, headers = {}) {
  return {
    statusCode,
    headers: {
      "Cache-Control": "no-store",
      ...headers
    }
  };
}

async function parseJsonBody(event) {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch (error) {
    throw createError(400, "Invalid JSON body");
  }
}

function requireMethod(event, method) {
  if (event.httpMethod !== method) {
    throw createError(405, `Method ${event.httpMethod} not allowed`, {
      headers: { Allow: method }
    });
  }
}

function handleError(error) {
  const statusCode = error.statusCode || 500;
  return json(statusCode, {
    error: error.message || "Internal server error"
  }, error.headers || {});
}

module.exports = {
  createError,
  json,
  text,
  noContent,
  parseJsonBody,
  requireMethod,
  handleError
};
