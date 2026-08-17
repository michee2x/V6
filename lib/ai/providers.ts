/**
 * lib/ai/providers.ts
 *
 * Centralised model configuration.
 * Swap models here — no changes needed in routes or orchestrator logic.
 *
 * Model routing strategy:
 *   - Claude Sonnet      → deep text analysis, creative briefs, refinement
 *   - Gemini 2.5 Pro     → video analysis (native YouTube URL support, visual + audio, 1M ctx)
 *   - Gemini 3.5 Flash   → fast general-purpose tasks
 *   - Imagen 3 (Vertex)  → image generation from briefs (requires Vertex AI credentials)
 *   - Veo                → video generation (PENDING - not yet in public API)
 */

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export const models = {
  // ── Analysis models ──────────────────────────────────────────────────────

  /** Deep analysis, creative briefs, refinement, article analysis */
  claude: anthropic("claude-sonnet-5"),

  /** Native video + image understanding. Supports YouTube URLs directly. 1M token context. */
  geminiPro: google("gemini-2.5-pro"),

  /** Fast general-purpose tasks */
  geminiFlash: google("gemini-3.5-flash"),
} as const;

/**
 * Returns the Imagen 3 model via Vertex AI.
 * Lazy getter — only initialises when called so missing Vertex env vars
 * don't crash the build or unrelated routes.
 *
 * Requires: GOOGLE_VERTEX_PROJECT and GOOGLE_VERTEX_LOCATION env vars.
 */
export function getImagen3Model() {
  const { vertex } = require("@ai-sdk/google-vertex");
  return vertex.image("imagen-3.0-generate-002");
}

// Veo (video generation) — PENDING public API access
// export function getVeoModel() {
//   const { vertex } = require("@ai-sdk/google-vertex");
//   return vertex.video("veo-2");
// }
