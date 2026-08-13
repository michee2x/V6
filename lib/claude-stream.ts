/**
 * lib/claude-stream.ts
 *
 * Shared helper: streams a Claude message and returns a ReadableStream
 * that emits Server-Sent Events (SSE) for the frontend to consume.
 *
 * SSE format used:
 *   data: {"type":"delta","text":"..."}\n\n   — incremental text chunk
 *   data: {"type":"done"}\n\n                 — stream complete
 *   data: {"type":"error","message":"..."}\n\n — stream error
 */

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompts";
import type { ImageData } from "./content-fetcher";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

function encodeSSE(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

interface StreamTextOptions {
  userPrompt: string;
  image?: ImageData; // if provided, sends as vision message
}

export function createClaudeStream({
  userPrompt,
  image,
}: StreamTextOptions): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      try {
        // Build the message content
        const content: Anthropic.MessageParam["content"] = image
          ? [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: image.mimeType as
                    | "image/jpeg"
                    | "image/png"
                    | "image/gif"
                    | "image/webp",
                  data: image.base64,
                },
              },
              { type: "text", text: userPrompt },
            ]
          : userPrompt;

        const stream = await anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
        });

        let fullText = "";

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullText += text;
            controller.enqueue(encodeSSE({ type: "delta", text }));
          }
        }

        controller.enqueue(encodeSSE({ type: "done", fullText }));
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Claude stream error";
        controller.enqueue(encodeSSE({ type: "error", message }));
        controller.close();
      }
    },
  });
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
