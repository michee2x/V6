// sharp is imported dynamically inside the function to avoid native module bundling issues

export interface InpaintOptions {
  base64Image: string;
  base64Mask: string;
  prompt: string;
}

export interface InpaintResult {
  base64: string;
  mimeType: string;
}

/**
 * Validates, formats, and submits an image and mask to OpenAI's DALL-E 2 image edits API.
 * The OpenAI API requires:
 * - Both image and mask must be PNG.
 * - Both must be square and < 4MB.
 * - Both must have identical dimensions.
 * - Mask transparent pixels (alpha=0) dictate where to edit.
 */
export async function inpaintImageWithOpenAI(
  options: InpaintOptions
): Promise<InpaintResult> {
  // Dynamic import keeps sharp out of the module-level bundle,
  // which prevents Turbopack from failing to initialise the route.
  const sharp = (await import("sharp")).default;

  const { base64Image, base64Mask, prompt } = options;

  // 1. Decode base64 to buffers
  const imageBuffer = Buffer.from(base64Image, "base64");
  const maskBuffer = Buffer.from(base64Mask, "base64");

  // 2. Read image metadata to determine original dimensions and aspect ratio
  const imageMeta = await sharp(imageBuffer).metadata();
  const width = imageMeta.width ?? 1024;
  const height = imageMeta.height ?? 1024;

  // Calculate the square size (max dimension)
  const squareSize = Math.max(width, height);
  // Cap square size to 1024 for DALL-E 2 edits
  const targetSize = Math.min(squareSize, 1024);

  // 3. Process the base image:
  // Pad to square, scale down to max 1024x1024, convert to PNG.
  const processedImageBuffer = await sharp(imageBuffer)
    .resize({
      width: targetSize,
      height: targetSize,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 4. Process the mask image:
  // Must match exact dimensions of the processed base image.
  // The unselected regions MUST be opaque, selected regions transparent.
  const processedMaskBuffer = await sharp(maskBuffer)
    .resize({
      width: targetSize,
      height: targetSize,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  // 5. Build FormData payload
  const formData = new FormData();
  formData.append(
    "image",
    new Blob([processedImageBuffer], { type: "image/png" }),
    "image.png"
  );
  formData.append(
    "mask",
    new Blob([processedMaskBuffer], { type: "image/png" }),
    "mask.png"
  );
  formData.append("prompt", prompt);
  formData.append("n", "1");
  formData.append("size", "1024x1024");
  formData.append("response_format", "b64_json");

  // 6. Call OpenAI Edits API
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg =
      (err as { error?: { message?: string } })?.error?.message ??
      "Image inpainting failed.";
    console.error("[generate/inpaint] OpenAI error:", msg);
    throw new Error(msg);
  }

  const data = (await response.json()) as {
    data: { b64_json: string }[];
  };

  if (!data.data || data.data.length === 0) {
    throw new Error("OpenAI returned no generated images.");
  }

  const resultBase64 = data.data[0].b64_json;

  // 7. Crop the square image back to the original aspect ratio
  const resultBuffer = Buffer.from(resultBase64, "base64");

  const scale = targetSize / squareSize;
  const originalScaledWidth = Math.round(width * scale);
  const originalScaledHeight = Math.round(height * scale);
  const left = Math.round((targetSize - originalScaledWidth) / 2);
  const top = Math.round((targetSize - originalScaledHeight) / 2);

  const croppedBuffer = await sharp(resultBuffer)
    .extract({
      left,
      top,
      width: originalScaledWidth,
      height: originalScaledHeight,
    })
    .png()
    .toBuffer();

  return {
    base64: croppedBuffer.toString("base64"),
    mimeType: "image/png",
  };
}
