/**
 * app/api/v1/sessions/[id]/brief/route.ts
 * POST — streams Phase 2 creative brief via SSE
 */

import { NextRequest } from "next/server";
import { getSession, updateSession } from "@/lib/session-store";
import { briefPrompt } from "@/lib/prompts";
import { createClaudeStream, sseResponse } from "@/lib/claude-stream";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = getSession(id);

  if (!session) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Session not found." })}\n\n`,
      { status: 404, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const baseInsight = session.advancedInsight || session.basicInsight;

  if (!baseInsight) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Insights must be completed first." })}\n\n`,
      { status: 422, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const userPrompt = briefPrompt(session.contentType, baseInsight);

  // If a brief already exists (e.g. on page refresh), just stream it back instantly
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";
  
  if (session.brief && !force) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "delta", text: session.brief })}\n\n`)
        );
        controller.close();
      }
    });
    return sseResponse(stream);
  }

  const claudeStream = createClaudeStream({ userPrompt });
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
      if (fullText) updateSession(id, { brief: fullText });
      controller.close();
    },
  });

  return sseResponse(persistingStream);
}
