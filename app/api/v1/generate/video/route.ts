/**
 * app/api/v1/generate/video/route.ts
 * POST — video generation from a creative brief
 *
 * STATUS: PENDING — Veo API is not yet in public API access.
 * This route is scaffolded and returns a meaningful error until Veo is available.
 * Once Veo is accessible, swap the body of this handler for:
 *   const result = await vertex.generate({ model: "veo-2", prompt, ... });
 *
 * Body: {
 *   sessionId: string
 *   customPrompt?: string
 *   aspectRatio?: "16:9" | "9:16" | "1:1"
 *   durationSeconds?: number
 * }
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message:
          "Video generation via Veo is coming soon. The Veo API is not yet in public access. " +
          "In the meantime, use your creative brief with Runway, Kling, or Pika.",
      },
    },
    { status: 501 }
  );
}
