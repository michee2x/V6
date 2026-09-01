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
import { generateImageFromBrief, enhanceImagePrompt } from "@/lib/ai/orchestrator";
import { consumeCredits, checkAnonymousUsage } from "@/lib/billing";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, customPrompt, aspectRatio, quality } = body as {
      sessionId?: string;
      customPrompt?: string;
      aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
      quality?: "low" | "medium" | "high";
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
              message: "Session has no Master Prompt yet. Generate a Master Prompt first.",
            },
          },
          { status: 422 }
        );
      }
      // The brief is now a Markdown document. Extract the final_prompt section if present.
      const match = session.brief.match(/## FINAL PROMPT\s+([\s\S]+)$/i);
      if (match && match[1]) {
        prompt = match[1].trim();
      } else {
        prompt = session.brief;
      }
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

    let userPlan = "free";
    const requestedQuality = quality ?? "medium";

    if (user) {
      // Consume credits based on quality tier
      const creditType = `image_${requestedQuality}`;
      try {
        const { plan } = await consumeCredits(user.id, creditType);
        userPlan = plan || "free";
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: { code: "INSUFFICIENT_CREDITS", message: err.message } },
          { status: 402 }
        );
      }

      // Enforce quality gating: free users can use up to medium quality
      const isPaid = userPlan !== "free";
      if (!isPaid && requestedQuality === "high") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PLAN_LIMIT",
              message: `High quality images require a Starter plan or above. Upgrade to unlock.`,
            },
          },
          { status: 403 }
        );
      }
    } else {
      // Anonymous rate limiting
      try {
        const fingerprint = req.cookies.get("visitor_fingerprint")?.value;
        const ip = req.headers.get("x-forwarded-for") || "";
        await checkAnonymousUsage(fingerprint, ip);
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: { code: "TRIAL_LIMIT_REACHED", message: err.message } },
          { status: 403 }
        );
      }
    }

    // 1. Enhance the prompt using Gemini Flash (all users)
    const enhancedPrompt = await enhanceImagePrompt(prompt);

    // 2. Route generation based on plan: Free -> OpenAI, Paid -> Imagen 3
    const isPaidPlan = userPlan !== "free";
    const modelType = isPaidPlan ? "imagen" : "openai";

    const images = await generateImageFromBrief({
      prompt: enhancedPrompt,
      aspectRatio: aspectRatio ?? "1:1",
      quality: requestedQuality as "low" | "medium" | "high",
      numberOfImages: 1,
      modelType,
    });

    let savedGenerationId: string | undefined;

    if (sessionId && images.length > 0) {
      // Free plan = 24hr expiry, Paid = null (forever)
      const expiresAt = isPaidPlan ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      try {
        const saved = await saveGeneration({
          sessionId,
          type: "image",
          model: modelType === "imagen" ? "imagen-3.0-generate-002" : `gpt-image-1 (${requestedQuality})`,
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
