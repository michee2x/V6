/**
 * lib/ai/orchestrator.ts
 *
 * Central AI orchestrator for v6.
 * ALL analysis is routed through Gemini Flash.
 * OpenAI handles recreation only (image gen, document gen, video gen).
 *
 * Analysis routing:
 *   YouTube URL  → Gemini Flash with native fileData URL (visual + audio frames)
 *   Inline video → Gemini Flash with base64 buffer (uploaded files, TikTok downloads)
 *   Image        → Gemini Flash with inline base64 vision
 *   Article/Text → Gemini Flash text reasoning
 *   Brief/Refine → Gemini Flash text (no media)
 */

import { streamText, generateText, experimental_generateVideo } from "ai";
import { models, getGoogleVideoModel } from "./providers";
import { SYSTEM_PROMPT } from "./prompts";
import type { ImageData } from "../content-fetcher";
import type { ContentType } from "../session-store";

// ─── SSE helpers ─────────────────────────────────────────────────────────────

export function encodeSSE(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ─── Analysis stream ──────────────────────────────────────────────────────────

interface AnalyzeOptions {
  userPrompt: string;
  contentType?: ContentType;

  /** For image analysis: base64 encoded image data */
  image?: ImageData;

  /** For YouTube: pass the public URL directly — Gemini reads frames natively */
  videoUrl?: string;

  /** For uploaded or downloaded videos: raw base64 bytes (no data URI prefix) */
  videoBase64?: string;

  /** MIME type of the inline video e.g. "video/mp4" */
  videoMimeType?: string;
}

/**
 * Creates a streaming SSE response using Gemini Flash for all content types.
 *
 * Routing:
 *  - YouTube URL  → fileData native URL (Gemini watches video frame-by-frame)
 *  - Inline video → base64 Buffer (uploaded files & TikTok downloads)
 *  - Image        → inline base64 vision
 *  - Text/article → plain text prompt
 */
export function createAnalysisStream({
  userPrompt,
  contentType,
  image,
  videoUrl,
  videoBase64,
  videoMimeType,
}: AnalyzeOptions): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      try {
        let content: any[];

        // ── Route 1: YouTube (or any direct video URL) → Gemini native URL ──
        if (videoUrl && contentType === "video") {
          content = [
            { type: "text", text: userPrompt },
            {
              type: "file",
              data: videoUrl,
              mediaType: "video/mp4",
            },
          ];
        }

        // ── Route 2: Inline video bytes (uploaded file or TikTok download) ──
        else if (videoBase64 && videoMimeType) {
          content = [
            { type: "text", text: userPrompt },
            {
              type: "file",
              data: Buffer.from(videoBase64, "base64"),
              mediaType: videoMimeType as any,
            },
          ];
        }

        // ── Route 3: Image → Gemini inline vision ────────────────────────────
        else if (image) {
          let safeMediaType = image.mimeType || "image/jpeg";

          const validTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ];

          if (!validTypes.includes(safeMediaType)) {
            safeMediaType = "image/jpeg";
          }

          content = [
            {
              type: "image",
              image: `data:${safeMediaType};base64,${image.base64}`,
            },
            { type: "text", text: userPrompt },
          ];
        }

        // ── Route 4: Text / Article ───────────────────────────────────────────
        else {
          content = [{ type: "text", text: userPrompt }];
        }

        const result = await streamText({
          model: models.gemini,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
          maxOutputTokens: 4096,
        });

        let fullText = "";

        for await (const textPart of result.textStream) {
          fullText += textPart;
          controller.enqueue(
            encodeSSE({
              type: "delta",
              text: textPart,
            })
          );
        }

        controller.enqueue(
          encodeSSE({
            type: "done",
            fullText,
          })
        );

        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "AI stream error";

        controller.enqueue(
          encodeSSE({
            type: "error",
            message,
          })
        );

        controller.close();
      }
    },
  });
}

// ─── Image generation ─────────────────────────────────────────────────────────

export async function enhanceImagePrompt(
  brief: string
): Promise<string> {
  const result = await generateText({
    model: models.gemini,
    system: `You are an elite creative director and prompt engineer. Your job is to take a raw creative brief and rewrite it into a highly descriptive, visually rich, and photography-optimized prompt for an AI image generator (like Imagen 3 or Midjourney).

Add appropriate keywords for lighting (e.g. cinematic lighting, soft diffused, volumetric), style (e.g. photorealistic, 8k, highly detailed, editorial), camera lens/composition (e.g. 35mm, macro, rule of thirds, depth of field), and emotional mood.

Do NOT output JSON or Markdown headers. Output ONLY a single paragraph of plain text (max 80 words) that is the optimized prompt.`,
    prompt: brief,
  });

  return result.text.trim();
}

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  numberOfImages?: number;
  quality?: string;
  modelType?: "openai" | "imagen";
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

/**
 * Generates an image using either OpenAI GPT Image 2 or Google Imagen.
 * Returns an array of generated images as base64 strings.
 *
 * OpenAI:
 *   - Uses gpt-image-2
 *   - Uses GPT Image 2 quality levels
 *   - Uses flexible resolutions
 *   - Returns base64 PNG images
 */
export async function generateImageFromBrief(
  options: GenerateImageOptions
): Promise<GeneratedImage[]> {
  const {
    prompt,
    aspectRatio = "1:1",
    numberOfImages = 1,
    modelType = "openai",
  } = options;

  // ── Google Imagen ─────────────────────────────────────────────────────────
  if (modelType === "imagen") {
    const { generateImage } = await import("ai");
    const { getGoogleImageModel } = await import("./providers");

    // Google Imagen supports these aspect ratios directly.
    const result = await generateImage({
      model: getGoogleImageModel(),
      prompt,
      n: numberOfImages,
      aspectRatio: aspectRatio,
    });

    return result.images.map((img) => ({
      base64: img.base64,
      mimeType: "image/png",
    }));
  }

  // ── OpenAI GPT Image 2 ────────────────────────────────────────────────────
  //
  // GPT Image 2 supports flexible resolutions.
  //
  // All custom width/height values must:
  //   1. Be divisible by 16
  //   2. Have an aspect ratio between 1:3 and 3:1
  //
  // These resolutions preserve the requested aspect ratio instead of
  // incorrectly falling back to 1024x1024 for portrait/landscape formats.

  const sizeMap: Record<string, string> = {
    "1:1": "1536x1536",
    "16:9": "1536x864",
    "9:16": "864x1536",
    "4:3": "1536x1152",
    "3:4": "1152x1536",
  };

  const size = sizeMap[aspectRatio] ?? "1536x1536";

  const response = await fetch(
    "https://api.openai.com/v1/images/generations",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },

      body: JSON.stringify({
        // Current OpenAI image generation model.
        model: "gpt-image-2",

        // Keep the Gemini-enhanced prompt exactly as supplied.
        prompt,

        // GPT Image 2 supports multiple images per request.
        n: numberOfImages,

        // GPT Image 2 supports flexible image dimensions.
        size,

        // IMPORTANT:
        // GPT Image 2 uses low / medium / high / auto.
        // "hd" belongs to the older DALL-E 3 API.
        quality: "high",

        // PNG preserves the maximum visual quality and is directly
        // compatible with the existing GeneratedImage return type.
        output_format: "png",

        // Let GPT Image 2 determine the appropriate background.
        background: "auto",

        // Keep OpenAI's default automatic moderation behavior.
        moderation: "auto",
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));

    const msg =
      (err as any)?.error?.message ??
      "Image generation failed.";

    console.error(
      "[generate/image] OpenAI error:",
      msg
    );

    throw new Error(msg);
  }

  const data = (await response.json()) as {
    data: {
      b64_json: string;
    }[];
  };

  if (!data.data || data.data.length === 0) {
    throw new Error("OpenAI returned no generated images.");
  }

  return data.data.map((img) => ({
    base64: img.b64_json,
    mimeType: "image/png",
  }));
}

// ─── Document generation ──────────────────────────────────────────────────────

export async function generateTextDocumentFromBrief(
  prompt: string,
  docType: string = "document"
): Promise<string> {
  const result = await generateText({
    model: models.gpt4o,
    system: `You are an expert creative director and writer. Turn the provided creative brief into a detailed and polished ${docType}. Output only the final document, beautifully formatted in Markdown.`,
    prompt,
  });

  return result.text;
}

// ─── Video generation ─────────────────────────────────────────────────────────

export interface GenerateVideoOptions {
  prompt: string;
}

export async function generateVideoFromBrief(
  options: GenerateVideoOptions
) {
  const { prompt } = options;

  const enhancedPrompt = `${prompt}

CRITICAL CONSTRAINT: Generate a maximum of 2-3 seconds of video only. Do not exceed 3 seconds.`;

  const result = await experimental_generateVideo({
    model: getGoogleVideoModel(),
    prompt: enhancedPrompt,
  });

  return result;
}