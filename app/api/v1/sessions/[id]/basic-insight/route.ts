/**
 * app/api/v1/sessions/[id]/basic-insight/route.ts
 * GET — streams Phase 1 basic insight via SSE
 */

import { NextRequest } from "next/server";
import { getSession, updateSession } from "@/lib/session-store";
import { fetchImageAsBase64 } from "@/lib/content-fetcher";
import { basicInsightPrompt } from "@/lib/prompts";
import { createClaudeStream, sseResponse } from "@/lib/claude-stream";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = getSession(id);

  if (!session) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Session not found." })}\n\n`,
      {
        status: 404,
        headers: { "Content-Type": "text/event-stream" },
      }
    );
  }

  // If already computed, stream the cached result instantly
  if (session.basicInsight) {
    const cached = session.basicInsight;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ type: "delta", text: cached })}\n\n`
          )
        );
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ type: "done", fullText: cached })}\n\n`
          )
        );
        controller.close();
      },
    });
    return sseResponse(stream);
  }

  // Resolve image data if needed
  let image = undefined;
  let content = session.fetchedContent;

  if (session.contentType === "image" && content.startsWith("IMAGE_BASE64:")) {
    // Locally-uploaded file — already a data URL, no network fetch needed
    const dataUrl = content.replace("IMAGE_BASE64:", "");
    const [meta, base64] = dataUrl.split(",");
    const mimeType = meta.replace("data:", "").replace(";base64", "");
    image = { base64, mimeType };
    content = "Analyse this image.";
  } else if (session.contentType === "image" && content.startsWith("IMAGE_URL:")) {
    const imageUrl = content.replace("IMAGE_URL:", "");
    try {
      image = await fetchImageAsBase64(imageUrl);
      content = "Analyse this image.";
    } catch {
      content = `Image URL (could not fetch directly): ${imageUrl}`;
    }
  }

  const userPrompt = basicInsightPrompt(session.contentType, content);

  // Wrap the Claude stream to also persist the full result to the session store
  const claudeStream = createClaudeStream({ userPrompt, image });
  const persistingStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = claudeStream.getReader();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Decode to peek at done event
        const text = new TextDecoder().decode(value);
        if (text.includes('"type":"done"')) {
          try {
            const match = text.match(/data: ({.*})/);
            if (match) {
              const parsed = JSON.parse(match[1]);
              fullText = parsed.fullText ?? fullText;
            }
          } catch { /* ignore parse errors */ }
        }
        if (text.includes('"type":"delta"')) {
          try {
            const match = text.match(/data: ({.*})/);
            if (match) {
              const parsed = JSON.parse(match[1]);
              fullText += parsed.text ?? "";
            }
          } catch { /* ignore */ }
        }
        controller.enqueue(value);
      }
      // Persist
      if (fullText) updateSession(id, { basicInsight: fullText });
      controller.close();
    },
  });

  return sseResponse(persistingStream);
}
