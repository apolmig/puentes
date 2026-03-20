const { json, parseJsonBody, requireMethod, createError, handleError } = require("./_lib/http");
const { createVideoJob } = require("./_lib/openai");
const { sanitizeModel } = require("../../lib/model-config");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "POST");
    const body = await parseJsonBody(event);

    if (!body.prompt) {
      throw createError(400, "Video prompt is required.");
    }

    const video = await createVideoJob({
      model: sanitizeModel("video", body.model),
      prompt: body.prompt,
      size: body.size || "1280x720",
      seconds: body.seconds || 8
    });

    return json(202, {
      model: sanitizeModel("video", body.model),
      video,
      pollUrl: `/.netlify/functions/video-status?id=${encodeURIComponent(video.id)}`,
      downloadUrl: `/.netlify/functions/video-download?id=${encodeURIComponent(video.id)}&variant=video`
    });
  } catch (error) {
    return handleError(error);
  }
};
