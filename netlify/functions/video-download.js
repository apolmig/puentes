const { requireMethod, createError, handleError } = require("./_lib/http");
const { downloadVideoAsset } = require("./_lib/openai");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "GET");
    const videoId = event.queryStringParameters?.id;
    const variant = event.queryStringParameters?.variant || "video";

    if (!videoId) {
      throw createError(400, "Video id is required.");
    }

    const asset = await downloadVideoAsset(videoId, variant);

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": asset.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "no-store"
      },
      body: asset.body.toString("base64")
    };
  } catch (error) {
    return handleError(error);
  }
};
