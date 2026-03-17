const { json, parseJsonBody, requireMethod, createError, handleError } = require("./_lib/http");
const { generateImageAsset } = require("./_lib/openai");

exports.handler = async function handler(event) {
  try {
    requireMethod(event, "POST");
    const body = await parseJsonBody(event);

    if (!body.prompt) {
      throw createError(400, "Image prompt is required.");
    }

    const payload = await generateImageAsset({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
      prompt: body.prompt,
      size: body.size || "1536x1024",
      quality: body.quality || "medium",
      background: body.background || "auto",
      outputFormat: body.outputFormat || "png"
    });

    const image = payload.data?.[0];
    return json(200, {
      created: payload.created,
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
      image: image ? {
        b64Json: image.b64_json,
        revisedPrompt: image.revised_prompt || "",
        mimeType: `image/${body.outputFormat || "png"}`,
        dataUrl: image.b64_json
          ? `data:image/${body.outputFormat || "png"};base64,${image.b64_json}`
          : ""
      } : null
    });
  } catch (error) {
    return handleError(error);
  }
};
