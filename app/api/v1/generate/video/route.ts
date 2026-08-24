/**
 * app/api/v1/generate/video/route.ts
 * POST — video generation from a creative brief using OpenAI
 *
 * Body: {
 *   sessionId: string
 *   customPrompt?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, saveGeneration } from "@/lib/session-store";
import { generateVideoFromBrief } from "@/lib/ai/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, customPrompt } = body as {
      sessionId?: string;
      customPrompt?: string;
    };

    let prompt = customPrompt?.trim() ?? "";

    if (sessionId && !prompt) {
      const session = await getSession(sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Session not found." } },
          { status: 404 }
        );
      }
      if (!session.brief) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Session has no creative brief yet. Generate a brief first.",
            },
          },
          { status: 422 }
        );
      }
      prompt = session.brief;
    }

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "A prompt or sessionId is required." },
        },
        { status: 400 }
      );
    }

    const videoResult = await generateVideoFromBrief({
      prompt,
    });

    let savedGenerationId: string | undefined;
    const videoData = videoResult.video; // Assume ai SDK returns { base64?, mimeType?, url? }

    // Use base64 or url whichever is available
    const stringData = (videoData as any)?.base64 || (videoData as any)?.url || "";

    if (sessionId && stringData) {
      const isPaidPlan = process.env.NEXT_PUBLIC_PAID_PLAN === "true";
      const expiresAt = isPaidPlan ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      try {
        const saved = await saveGeneration({
          sessionId,
          type: "video",
          model: "ChatGPT Video",
          data: stringData,
          mimeType: (videoData as any)?.mimeType || "video/mp4",
          expiresAt,
        });
        savedGenerationId = saved.id;
      } catch (err) {
        console.error("Failed to save generation to DB:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: { video: videoData, generationId: savedGenerationId }, // ai SDK returns `video` as GenerateVideoResult
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video generation failed.";
    console.error("[generate/video]", message);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 }
    );
  }
}
