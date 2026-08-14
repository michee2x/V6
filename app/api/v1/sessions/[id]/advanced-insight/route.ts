/**
 * app/api/v1/sessions/[id]/advanced-insight/route.ts
 * POST — streams Phase 1.5 advanced insight via SSE
 */

import { NextRequest } from "next/server";
import { getSession, updateSession } from "@/lib/session-store";
import { fetchImageAsBase64 } from "@/lib/content-fetcher";
import { advancedInsightPrompt } from "@/lib/prompts";
import { createClaudeStream, sseResponse } from "@/lib/claude-stream";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await getSession(id);

  if (!session) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Session not found." })}\n\n`,
      { status: 404, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  if (!session.basicInsight) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Basic insight must be completed first." })}\n\n`,
      { status: 422, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  // Return cached if already done
  if (session.advancedInsight) {
    const cached = session.advancedInsight;
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

  let image = undefined;
  let content = session.fetchedContent;

  if (session.contentType === "image" && content.startsWith("IMAGE_BASE64:")) {
    const dataUrl = content.replace("IMAGE_BASE64:", "");
    const [meta, base64] = dataUrl.split(",");
    const mimeType = meta.replace("data:", "").replace(";base64", "");
    image = { base64, mimeType };
    content = "Analyse this image in depth.";
  } else if (session.contentType === "image" && content.startsWith("IMAGE_URL:")) {
    const imageUrl = content.replace("IMAGE_URL:", "");
    try {
      image = await fetchImageAsBase64(imageUrl);
      content = "Analyse this image in depth.";
    } catch {
      content = `Image URL (could not fetch directly): ${imageUrl}`;
    }
  }

  const userPrompt = advancedInsightPrompt(
    session.contentType,
    content,
    session.basicInsight
  );

  const claudeStream = createClaudeStream({ userPrompt, image });
  const persistingStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = claudeStream.getReader();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        if (text.includes('"type":"delta"')) {
          try {
            const m = text.match(/data: ({.*})/);
            if (m) fullText += JSON.parse(m[1]).text ?? "";
          } catch { /* ignore */ }
        }
        controller.enqueue(value);
      }
      if (fullText) await updateSession(id, { advancedInsight: fullText });
      controller.close();
    },
  });

  return sseResponse(persistingStream);
}
