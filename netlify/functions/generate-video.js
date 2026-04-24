const { json, parseJsonBody, requireMethod, createError, handleError } = require("./_lib/http");
const { requireAccess } = require("./_lib/access");
const { createVideoJob, sanitizeVideoId, videoDownloadUrl } = require("./_lib/openai");
const { sanitizeModel } = require("../../lib/model-config");

exports.handler = async function handler(event, context) {
  try {
    requireMethod(event, "POST");
    requireAccess(event, context, { scope: "ai" });
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
    const safeVideoId = sanitizeVideoId(video.id);

    return json(202, {
      model: sanitizeModel("video", body.model),
      video,
      pollUrl: `/.netlify/functions/video-status?id=${encodeURIComponent(safeVideoId)}`,
      downloadUrl: videoDownloadUrl(safeVideoId, "video")
    });
  } catch (error) {
    return handleError(error);
  }
};
