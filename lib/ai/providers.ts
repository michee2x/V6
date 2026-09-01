/**
 * lib/ai/providers.ts
 *
 * Centralised model configuration.
 * Swap models here — no changes needed in routes or orchestrator logic.
 *
 * Model routing strategy:
 *   - Gemini Flash  → ALL analysis: video (native YouTube URL), image, article, brief, refinement
 *   - GPT-4o        → Text document recreation from briefs
 *   - gpt-image-1   → Image generation from briefs
 *   - Veo 3.1 Fast  → Video generation via Vertex AI (2–3 sec clips)
 *
 * Vertex AI auth: credentials are read from GOOGLE_APPLICATION_CREDENTIALS_JSON
 * (a single-line JSON string in env vars) rather than a physical file.
 * This works locally (.env.local) and on Vercel (dashboard env vars).
 */

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { createVertex } from "@ai-sdk/google-vertex";

export const models = {
  // ── Analysis (Gemini) ─────────────────────────────────────────────────────
  /**
   * Gemini Flash — used for ALL analysis phases:
   *   - Video: native YouTube URL visual+audio understanding (no transcript needed)
   *   - Image: inline base64 vision
   *   - Article/Text: deep reasoning
   *   - Brief generation & refinement
   */
  gemini: google("gemini-3.6-flash"),

  // ── Recreation (OpenAI) ───────────────────────────────────────────────────

  /** Used for creating text documents from briefs */
  gpt4o: openai("gpt-4o"),
} as const;

/**
 * Returns the gpt-image-1 image generation model.
 */
export function getOpenAIImageModel() {
  return openai.image("dall-e-3");
}

/**
 * Builds a Vertex AI provider instance authenticated from the
 * GOOGLE_APPLICATION_CREDENTIALS_JSON env var (compact JSON string).
 * Works identically locally and on Vercel — no file on disk required.
 */
function buildVertexProvider() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. " +
      "Add the service-account JSON (minified, single line) to your env vars."
    );
  }
  const credentials = JSON.parse(raw);
  return createVertex({
    project: process.env.GOOGLE_VERTEX_PROJECT ?? credentials.project_id,
    location: process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1",
    googleAuthOptions: { credentials },
  });
}

/**
 * Returns the Veo 3.1 Fast video generation model via Vertex AI.
 * Videos are capped at 2–3 seconds max to keep costs under control (~$0.45–$0.90/video).
 * Model: veo-3.1-fast-generate-001
 */
export function getGoogleVideoModel() {
  return buildVertexProvider().video("veo-3.1-fast-generate-001");
}

/**
 * Returns the Imagen 3 model via Vertex AI.
 * Model: imagen-3.0-generate-002
 */
export function getGoogleImageModel() {
  return buildVertexProvider().image("imagen-3.0-generate-002");
}
