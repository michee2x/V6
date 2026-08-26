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
import { getSession, saveGeneration } from "@/lib/session-store";
import { generateImageFromBrief } from "@/lib/ai/orchestrator";
import { consumeCredits, checkAnonymousUsage } from "@/lib/billing";
import { createClient } from "@/utils/supabase/server";

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

    // Billing check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Consume credits
      try {
        await consumeCredits(user.id, "image");
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: { code: "INSUFFICIENT_CREDITS", message: err.message } },
          { status: 402 }
        );
      }
    } else {
      // Anonymous rate limiting
      try {
        const fingerprint = req.cookies.get("visitor_fingerprint")?.value;
        const ip = req.headers.get("x-forwarded-for") || req.ip || "";
        await checkAnonymousUsage(fingerprint, ip);
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: { code: "TRIAL_LIMIT_REACHED", message: err.message } },
          { status: 403 }
        );
      }
    }

    const images = await generateImageFromBrief({
      prompt,
      aspectRatio: aspectRatio ?? "1:1",
      numberOfImages: 1,
    });

    let savedGenerationId: string | undefined;

    if (sessionId && images.length > 0) {
      // Free plan = 24hr expiry, Paid = null (forever)
      const isPaidPlan = process.env.NEXT_PUBLIC_PAID_PLAN === "true";
      const expiresAt = isPaidPlan ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      try {
        const saved = await saveGeneration({
          sessionId,
          type: "image",
          model: "gpt-image-1",
          data: images[0].base64,
          mimeType: images[0].mimeType,
          expiresAt,
        });
        savedGenerationId = saved.id;
      } catch (err) {
        console.error("Failed to save generation to DB:", err);
        // We still return the image even if saving failed
      }
    }

    return NextResponse.json({
      success: true,
      data: { images, generationId: savedGenerationId },
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
