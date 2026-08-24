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
 *   - Sora          → Video generation (future)
 *
 * Claude is NOT used — all analysis has moved to Gemini.
 */

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

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
 * Returns the OpenAI video model (Sora).
 */
export function getOpenAIVideoModel() {
  return openai("sora-video");
}
