/**
 * app/api/v1/sessions/[id]/advanced-insight/route.ts
 * POST — streams Phase 1.5 advanced insight via SSE
 *
 * Video routing:
 *   YouTube URL  → Gemini watches video natively via URL (visual frames + audio)
 *   TikTok URL   → download MP4 to RAM via tikwm, pass inline to Gemini
 *   Uploaded vid → extract VIDEO_BASE64 from fetchedContent, pass inline
 *   Other video  → text/metadata prompt only
 */

import { NextRequest } from "next/server";
import { getSession, updateSession } from "@/lib/session-store";
import { fetchImageAsBase64, fetchTikTokVideoData } from "@/lib/content-fetcher";
import { advancedInsightPrompt } from "@/lib/ai/prompts";
import { createAnalysisStream, sseResponse } from "@/lib/ai/orchestrator";

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

  // ── Resolve media for the AI call ────────────────────────────────────────────
  let image = undefined;
  let videoUrl: string | undefined = undefined;
  let videoBase64: string | undefined = undefined;
  let videoMimeType: string | undefined = undefined;
  let content = session.fetchedContent;

  if (session.contentType === "image") {
    // ── Image: local upload ──────────────────────────────────────────────────
    if (content.startsWith("IMAGE_BASE64:")) {
      const dataUrl = content.replace("IMAGE_BASE64:", "");
      const [meta, base64] = dataUrl.split(",");
      const mimeType = meta.replace("data:", "").replace(";base64", "");
      image = { base64, mimeType };
      content = "Analyse this image in depth.";
    }
    // ── Image: remote URL ────────────────────────────────────────────────────
    else if (content.startsWith("IMAGE_URL:")) {
      const imageUrl = content.replace("IMAGE_URL:", "");
      try {
        image = await fetchImageAsBase64(imageUrl);
        content = "Analyse this image in depth.";
      } catch {
        content = `Image URL (could not fetch directly): ${imageUrl}`;
      }
    }
  } else if (session.contentType === "video") {
    // ── Video: YouTube → pass URL to Gemini for native visual analysis ───────
    if (/youtube\.com|youtu\.be/i.test(session.url)) {
      videoUrl = session.url;
    }
    // ── Video: TikTok → download MP4 to RAM, pass inline ────────────────────
    else if (/tiktok\.com/i.test(session.url)) {
      const tiktokData = await fetchTikTokVideoData(session.url);
      if (tiktokData) {
        videoBase64 = tiktokData.base64;
        videoMimeType = tiktokData.mimeType;
      }
      // If download failed, `content` still has metadata text as fallback
    }
    // ── Video: uploaded file (VIDEO_BASE64 prefix) ───────────────────────────
    else if (content.startsWith("VIDEO_BASE64:")) {
      const dataUrl = content.replace("VIDEO_BASE64:", "");
      const [meta, base64] = dataUrl.split(",");
      videoBase64 = base64;
      videoMimeType = meta.replace("data:", "").replace(";base64", "");
      content = "Analyse this video in depth.";
    }
  }

  const userPrompt = advancedInsightPrompt(
    session.contentType,
    content,
    session.basicInsight,
    session.focusHint
  );

  const aiStream = createAnalysisStream({
    userPrompt,
    contentType: session.contentType,
    image,
    videoUrl,
    videoBase64,
    videoMimeType,
  });
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
            const m = text.match(/data: (.*)/);
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
