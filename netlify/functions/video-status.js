const { json, requireMethod, createError, handleError } = require("./_lib/http");
const { requireAccess } = require("./_lib/access");
const { getVideoJob, sanitizeVideoId, videoDownloadUrl } = require("./_lib/openai");

exports.handler = async function handler(event, context) {
  try {
    requireMethod(event, "GET");
    requireAccess(event, context, { scope: "ai" });
    const videoId = event.queryStringParameters?.id;

    if (!videoId) {
      throw createError(400, "Video id is required.");
    }

    const safeVideoId = sanitizeVideoId(videoId);
    const video = await getVideoJob(safeVideoId);

    return json(200, {
      video,
      download: {
        video: videoDownloadUrl(safeVideoId, "video"),
        thumbnail: videoDownloadUrl(safeVideoId, "thumbnail"),
        spritesheet: videoDownloadUrl(safeVideoId, "spritesheet")
      }
    });
  } catch (error) {
    return handleError(error);
  }
};
