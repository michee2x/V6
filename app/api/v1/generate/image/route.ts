/**
 * app/api/v1/generate/image/route.ts
 * POST — generates an image from a creative brief using Imagen 3
 *
 * Body: {
 *   sessionId: string        — the session whose brief to use
 *   customPrompt?: string    — optional override prompt
 *   aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
 * }
 *
 * Returns: { success: true, data: { images: Array<{ base64: string, mimeType: string }> } }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store";
import { generateImageFromBrief } from "@/lib/ai/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, customPrompt, aspectRatio } = body as {
      sessionId?: string;
      customPrompt?: string;
      aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
    };

    let prompt = customPrompt?.trim() ?? "";

    // If a sessionId is provided, pull the brief from the session as the base prompt
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

    const images = await generateImageFromBrief({
      prompt,
      aspectRatio: aspectRatio ?? "1:1",
      numberOfImages: 1,
    });

    return NextResponse.json({
      success: true,
      data: { images },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed.";
    console.error("[generate/image]", message);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 }
    );
  }
}
