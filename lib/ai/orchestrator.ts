/**
 * lib/ai/orchestrator.ts
 *
 * Central AI orchestrator for v6.
 * Routes tasks to the best model for the job:
 *
 *   VIDEO analysis  → Gemini 1.5 Pro (native YouTube URL visual+audio analysis)
 *   IMAGE analysis  → Claude 3.5 Sonnet (best vision quality for stills)
 *   ARTICLE/TEXT    → Claude 3.5 Sonnet (deep reasoning, best writing)
 *   IMAGE generation→ Imagen 3 via Vertex AI
 *   VIDEO generation→ PENDING (Veo — not yet in public API)
 */

import { streamText, generateImage, LanguageModel } from "ai";
import { models, getImagen3Model } from "./providers";
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
  /** For video analysis: public YouTube video URL for Gemini native processing */
  youtubeUrl?: string;
}

/**
 * Creates a streaming SSE response from the best model for the given content type.
 *
 * Routing:
 *  - YouTube videos  → Gemini 1.5 Pro with native video URL (visual + audio + speech)
 *  - Image stills    → Claude 3.5 Sonnet with base64 vision
 *  - Articles/text   → Claude 3.5 Sonnet
 */
export function createAnalysisStream({
  userPrompt,
  contentType,
  image,
  youtubeUrl,
}: AnalyzeOptions): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      try {
        let selectedModel: LanguageModel;
        let content: any[];

        // ── Route: YouTube video → Gemini native video understanding ──
        if (youtubeUrl && contentType === "video") {
          selectedModel = models.geminiPro;
          content = [
            {
              type: "file",
              data: { type: "url", url: new URL(youtubeUrl) },
              mediaType: "video/mp4",
            },
            { type: "text", text: userPrompt },
          ];
        }
        // ── Route: Image → Claude vision ──────────────────────────────
        else if (image) {
          selectedModel = models.claude;
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
        // ── Route: Text/Article → Claude reasoning ────────────────────
        else {
          selectedModel = models.claude;
          content = [{ type: "text", text: userPrompt }];
        }

        const result = await streamText({
          model: selectedModel,
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

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  numberOfImages?: number;
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

/**
 * Generates an image using Google Imagen 3 via Vertex AI.
 * Returns an array of generated images as base64 strings.
 */
export async function generateImageFromBrief(
  options: GenerateImageOptions
): Promise<GeneratedImage[]> {
  const { prompt, aspectRatio = "1:1", numberOfImages = 1 } = options;

  const result = await generateImage({
    model: getImagen3Model(),
    prompt,
    aspectRatio,
    n: numberOfImages,
  });

  return result.images.map((img) => ({
    base64: img.base64,
    mimeType: (img as { base64: string; mimeType?: string }).mimeType ?? "image/png",
  }));
}
