import { NextRequest, NextResponse } from "next/server";
import { saveGeneration } from "@/lib/session-store";
import { consumeCredits, checkAnonymousUsage } from "@/lib/billing";
import { createClient } from "@/utils/supabase/server";
import { inpaintImageWithOpenAI } from "@/lib/ai/inpaint";

// Force Node.js runtime — required for sharp (native module) and FormData/Buffer usage
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, base64Image, base64Mask, prompt } = body as {
      sessionId?: string;
      base64Image?: string;
      base64Mask?: string;
      prompt?: string;
    };

    if (!base64Image || !base64Mask || !prompt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "base64Image, base64Mask, and prompt are required." },
        },
        { status: 400 }
      );
    }

    // Billing check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userPlan = "free";

    if (user) {
      // Consume standard image generation credits
      const creditType = `image`;
      try {
        const { plan } = await consumeCredits(user.id, creditType);
        userPlan = plan || "free";
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
        const ip = req.headers.get("x-forwarded-for") || "";
        await checkAnonymousUsage(fingerprint, ip);
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: { code: "TRIAL_LIMIT_REACHED", message: err.message } },
          { status: 403 }
        );
      }
    }

    // Process image inpainting via OpenAI
    const result = await inpaintImageWithOpenAI({
      base64Image,
      base64Mask,
      prompt,
    });

    let savedGenerationId: string | undefined;

    if (sessionId) {
      const isPaidPlan = userPlan !== "free";
      // Free plan = 24hr expiry, Paid = null (forever)
      const expiresAt = isPaidPlan ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      try {
        const saved = await saveGeneration({
          sessionId,
          type: "image",
          model: "gpt-image-2.5-sunburst-inpaint",
          data: result.base64,
          mimeType: result.mimeType,
          expiresAt,
        });
        savedGenerationId = saved.id;
      } catch (err) {
        console.error("Failed to save generation to DB:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: { images: [result], generationId: savedGenerationId },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image inpainting failed.";
    console.error("[generate/inpaint]", message);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 }
    );
  }
}

