/**
 * app/api/v1/sessions/route.ts
 * POST — create a new analysis session
 *
 * Accepts either:
 *   - JSON body: { url: string; contentType?: "auto" | "video" | "image" | "article"; focusHint?: string }
 *   - FormData:  { file: File; contentType?: string; focusHint?: string }
 *
 * Returns: { success: true, data: { sessionId, contentType, url } }
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/utils/supabase/server";
import {
  detectContentType,
  fetchVideoMetadata,
  fetchArticleText,
  validateUrlSupport,
} from "@/lib/content-fetcher";
import { createSession } from "@/lib/session-store";
import type { ContentType } from "@/lib/session-store";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const contentTypeHeader = req.headers.get("content-type") ?? "";

    // ── Multipart file upload path ──────────────────────────────────────────
    if (contentTypeHeader.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const declaredType = (form.get("contentType") as string) ?? "auto";
      const focusHint = (form.get("focusHint") as string) || null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "No file provided.", field: "file" } },
          { status: 400 }
        );
      }

      const mimeType = file.type;
      let resolvedType: ContentType = "image";
      if (mimeType.startsWith("video/")) resolvedType = "video";
      else if (declaredType && declaredType !== "auto") resolvedType = declaredType as ContentType;

      // Convert to base64 so the AI route can read it
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const sessionId = randomUUID();
      const pseudoUrl = `upload://${file.name}`;

      await createSession({
        id: sessionId,
        url: pseudoUrl,
        contentType: resolvedType,
        fetchedContent: resolvedType === "image" ? `IMAGE_BASE64:${dataUrl}` : dataUrl,
        focusHint,
        userId,
      });

      return NextResponse.json({
        success: true,
        data: { sessionId, contentType: resolvedType, url: pseudoUrl },
      });
    }

    // ── JSON / URL path ─────────────────────────────────────────────────────
    const body = await req.json();
    const { url, contentType: declaredType, focusHint } = body as {
      url?: string;
      contentType?: string;
      focusHint?: string;
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

    // Validate URL shape and platform support
    try {
      new URL(url);
      validateUrlSupport(url);
    } catch (err) {
      const message = err instanceof Error && err.message.includes("not supported")
        ? err.message
        : "That doesn't look like a valid URL.";

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message,
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
    await createSession({
      id: sessionId,
      url,
      contentType: resolvedType,
      fetchedContent,
      focusHint: focusHint || null,
      userId,
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
