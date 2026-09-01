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
              data: videoUrl,         // plain URL string — Gemini handles it natively
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
          const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
          if (!validTypes.includes(safeMediaType)) safeMediaType = "image/jpeg";
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
          maxOutputTokens: 2048,
        });

        let fullText = "";
        for await (const textPart of result.textStream) {
          fullText += textPart;
          controller.enqueue(encodeSSE({ type: "delta", text: textPart }));
        }

        controller.enqueue(encodeSSE({ type: "done", fullText }));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "AI stream error";
        controller.enqueue(encodeSSE({ type: "error", message }));
        controller.close();
      }
    },
  });
}

// ─── Image generation ─────────────────────────────────────────────────────────

export async function enhanceImagePrompt(brief: string): Promise<string> {
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
  quality?: "low" | "medium" | "high";
  modelType?: "openai" | "imagen";
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

/**
 * Generates an image using either OpenAI gpt-image-1 (DALL-E 3) or Google Imagen 3.
 * Returns an array of generated images as base64 strings.
 */
export async function generateImageFromBrief(
  options: GenerateImageOptions
): Promise<GeneratedImage[]> {
  const { prompt, aspectRatio = "1:1", numberOfImages = 1, quality = "low", modelType = "openai" } = options;

  const sizeMap: Record<string, string> = {
    "1:1":  "1024x1024",
    "16:9": "1536x1024",
    "9:16": "1024x1536",
    "4:3":  "1365x1024",
    "3:4":  "1024x1365",
  };
  const size = sizeMap[aspectRatio] ?? "1024x1024";

  if (modelType === "imagen") {
    // Dynamically import ai SDK image generator
    const { generateImage } = await import("ai");
    const { getGoogleImageModel } = await import("./providers");
    
    // Map aspectRatio to the format expected by Google Image
    // The google provider accepts 1:1, 16:9, 9:16, 4:3, 3:4.
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

  // Fallback / default: OpenAI (gpt-image-1)
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: numberOfImages,
      size,
      quality,
      output_format: "png",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as any)?.error?.message ?? "Image generation failed.";
    console.error("[generate/image] OpenAI error:", msg);
    throw new Error(msg);
  }

  const data = await response.json() as { data: { b64_json: string }[] };
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

  const enhancedPrompt = `${prompt}\n\nCRITICAL CONSTRAINT: Generate a maximum of 2-3 seconds of video only. Do not exceed 3 seconds.`;

  const result = await experimental_generateVideo({
    model: getGoogleVideoModel(),
    prompt: enhancedPrompt,
  });

  return result;
}
