/**
 * app/api/v1/sessions/[id]/refine/route.ts
 * POST — streams a refined brief via SSE
 *
 * Body: { brief: string; instruction: string }
 */

import { NextRequest } from "next/server";
import { getSession, updateSession } from "@/lib/session-store";
import { refinePrompt } from "@/lib/ai/prompts";
import { createAnalysisStream, sseResponse } from "@/lib/ai/orchestrator";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await getSession(id);

  if (!session) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Session not found." })}\n\n`,
      { status: 404, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let body: { brief?: string; instruction?: string; image?: { mimeType: string; base64: string } };
  try {
    body = await req.json();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Invalid request body." })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const { brief, instruction } = body;

  if (!brief || !instruction) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "brief and instruction are required." })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const userPrompt = refinePrompt(brief, instruction);

  const aiStream = createAnalysisStream({ userPrompt, image: body.image });
  const persistingStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = aiStream.getReader();
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
      // Update the stored brief to the refined version
      if (fullText) await updateSession(id, { brief: fullText });
      controller.close();
    },
  });

  return sseResponse(persistingStream);
}
