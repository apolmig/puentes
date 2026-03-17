const { json, parseJsonBody, requireMethod, createError, handleError } = require("./_lib/http");
const { createVideoJob } = require("./_lib/openai");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "POST");
    const body = await parseJsonBody(event);

    if (!body.prompt) {
      throw createError(400, "Video prompt is required.");
    }

    const video = await createVideoJob({
      model: process.env.OPENAI_VIDEO_MODEL || "sora-2",
      prompt: body.prompt,
      size: body.size || "1280x720",
      seconds: body.seconds || 8
    });

    return json(202, {
      model: process.env.OPENAI_VIDEO_MODEL || "sora-2",
      video,
      pollUrl: `/.netlify/functions/video-status?id=${encodeURIComponent(video.id)}`,
      downloadUrl: `/.netlify/functions/video-download?id=${encodeURIComponent(video.id)}&variant=video`
    });
  } catch (error) {
    return handleError(error);
  }
};
