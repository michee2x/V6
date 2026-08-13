/**
 * app/api/v1/sessions/route.ts
 * POST — create a new analysis session
 *
 * Body: { url: string; contentType?: "auto" | "video" | "image" | "article" }
 * Returns: { success: true, data: { sessionId, contentType, url } }
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  detectContentType,
  fetchVideoMetadata,
  fetchArticleText,
  fetchImageAsBase64,
} from "@/lib/content-fetcher";
import { createSession } from "@/lib/session-store";
import type { ContentType } from "@/lib/session-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, contentType: declaredType } = body as {
      url?: string;
      contentType?: string;
    };

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid URL is required.",
            field: "url",
          },
        },
        { status: 400 }
      );
    }

    // Validate URL shape
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "That doesn't look like a valid URL.",
            field: "url",
          },
        },
        { status: 400 }
      );
    }

    // Resolve content type
    const resolvedType: ContentType =
      declaredType && declaredType !== "auto"
        ? (declaredType as ContentType)
        : detectContentType(url);

    // Fetch content server-side
    let fetchedContent = "";
    try {
      if (resolvedType === "video") {
        fetchedContent = await fetchVideoMetadata(url);
      } else if (resolvedType === "image") {
        // For image, we store a marker — the actual base64 is fetched per-request
        // in the insight route to keep session store lean.
        fetchedContent = `IMAGE_URL:${url}`;
      } else {
        fetchedContent = await fetchArticleText(url);
      }
    } catch (fetchErr) {
      const message =
        fetchErr instanceof Error ? fetchErr.message : "Could not fetch content";
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: `Could not read that URL: ${message}`,
          },
        },
        { status: 422 }
      );
    }

    const sessionId = randomUUID();
    createSession({
      id: sessionId,
      url,
      contentType: resolvedType,
      fetchedContent,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { sessionId, contentType: resolvedType, url },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Something went wrong on our end.",
        },
      },
      { status: 500 }
    );
  }
}
