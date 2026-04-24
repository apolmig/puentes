const { requireMethod, createError, handleError } = require("./_lib/http");
const { requireAccess } = require("./_lib/access");
const { downloadVideoAsset, sanitizeVideoId, sanitizeVideoVariant } = require("./_lib/openai");

exports.handler = async function handler(event, context) {
  try {
    requireMethod(event, "GET");
    requireAccess(event, context, { scope: "download" });
    const videoId = event.queryStringParameters?.id;
    const variant = event.queryStringParameters?.variant || "video";

    if (!videoId) {
      throw createError(400, "Video id is required.");
    }

    const asset = await downloadVideoAsset(sanitizeVideoId(videoId), sanitizeVideoVariant(variant));

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": asset.contentType,
        "Content-Length": String(asset.contentLength),
        "Content-Disposition": `attachment; filename="${asset.filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      },
      body: asset.body.toString("base64")
    };
  } catch (error) {
    return handleError(error);
  }
};
