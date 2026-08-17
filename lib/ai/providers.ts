/**
 * lib/ai/providers.ts
 *
 * Centralised model configuration.
 * Swap models here — no changes needed in routes or orchestrator logic.
 *
 * Model routing strategy:
 *   - Claude 3.5 Sonnet  → deep text analysis, creative briefs, refinement
 *   - Gemini 1.5 Pro     → video analysis (native YouTube URL support, visual + audio)
 *   - Gemini 2.0 Flash   → fast tasks, article analysis
 *   - Imagen 3 (Vertex)  → image generation from briefs
 *   - Veo                → video generation (PENDING - not yet in public API)
 */

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { vertex } from "@ai-sdk/google-vertex";

export const models = {
  // ── Analysis models ──────────────────────────────────────────────────────

  /** Deep analysis, creative briefs, refinement, article analysis */
  claude: anthropic("claude-3-5-sonnet-20240620"),

  /** Native video + image understanding. Supports YouTube URLs directly. */
  geminiPro: google("gemini-2.0-flash"),

  /** Fast general-purpose tasks */
  geminiFlash: google("gemini-2.0-flash"),

  // ── Generation models ────────────────────────────────────────────────────

  /** Image generation from text prompts */
  imagen3: vertex.image("imagen-3.0-generate-002"),

  // Veo (video generation) — PENDING public API access
  // veo: vertex.video("veo-2"),
} as const;
