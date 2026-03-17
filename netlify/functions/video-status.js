const { json, requireMethod, createError, handleError } = require("./_lib/http");
const { getVideoJob } = require("./_lib/openai");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "GET");
    const videoId = event.queryStringParameters?.id;

    if (!videoId) {
      throw createError(400, "Video id is required.");
    }

    const video = await getVideoJob(videoId);

    return json(200, {
      video,
      download: {
        video: `/.netlify/functions/video-download?id=${encodeURIComponent(videoId)}&variant=video`,
        thumbnail: `/.netlify/functions/video-download?id=${encodeURIComponent(videoId)}&variant=thumbnail`,
        spritesheet: `/.netlify/functions/video-download?id=${encodeURIComponent(videoId)}&variant=spritesheet`
      }
    });
  } catch (error) {
    return handleError(error);
  }
};
