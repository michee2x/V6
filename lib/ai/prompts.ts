/**
 * lib/prompts.ts
 *
 * All Gemini prompt templates for v6.
 * Every AI behaviour in the app flows through this file.
 */

import type { ContentType } from '../session-store';

// ─── System prompt ────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are an expert content analyst and master prompt engineer for v6, a tool that helps people understand content deeply and recreate inspired work from it.

Your job is to analyse content and help users both understand what makes it work AND generate a professional Master Prompt that captures every visual, stylistic, and technical detail needed for AI generation tools to produce a faithful, high-quality recreation.

Rules:
- Be direct and specific — no filler phrases like "certainly!" or "great question"
- Write in plain, clean prose for analysis sections
- When generating Master Prompts, be extremely precise and technical — this is for AI, not humans
- Never reproduce copyrighted content verbatim — generalise and inspire, don't copy
- Frame everything as "inspired by" not "copy of"`;

// ─── Phase 1 — Basic Insight ──────────────────────────────────────────────────

const basicInsightInstructions: Record<ContentType, string> = {
  video: `Provide a fast, clear breakdown covering:
- What the video is about (1-2 sentences)
- Who's in it / who made it
- The format and rough pacing (e.g. talking head, montage, tutorial)
- The main takeaway or message

Keep it tight — this is the "get your bearings in 10 seconds" layer. 3-5 short paragraphs max.`,

  image: `Provide a fast, clear breakdown covering:
- What the subject is
- The visual style and mood
- Key compositional choices
- What makes it immediately striking

Keep it tight — this is the "get your bearings in 10 seconds" layer. 3-5 short paragraphs max.`,

  article: `Provide a fast, clear breakdown covering:
- The central thesis or main argument
- The 3-4 most important points made
- The tone and intended audience
- The key takeaway

Keep it tight — this is the "get your bearings in 10 seconds" layer. 3-5 short paragraphs max.`,
};

export function basicInsightPrompt(
  type: ContentType,
  content: string,
  focusHint?: string | null
): string {
  const focusLine = focusHint
    ? `IMPORTANT: The user specifically wants to focus on: "${focusHint}". Keep your entire analysis centred on this aspect.\n\n`
    : '';
  return `${focusLine}${basicInsightInstructions[type]}

Content to analyse:
---
${content}
---`;
}

// ─── Phase 1.5 — Advanced Insights ───────────────────────────────────────────

const advancedInsightInstructions: Record<ContentType, string> = {
  video: `Go deep. This is the analytical layer that will power the Master Prompt.

Cover all of:
1. **Shot structure** — how is the video visually constructed? Scene types, angles, transitions.
2. **Pacing and edit rhythm** — cuts per minute, tempo, where it breathes vs. rushes
3. **Voiceover / on-camera tone** — delivery style, energy, personality markers
4. **Editing techniques** — text overlays, motion graphics, sound design, music use
5. **Hook mechanics** — what exactly happens in the first 3 seconds and why it works
6. **Why it works** — the underlying psychological or structural reason this content performs

Be specific and analytical. This output will be used to create a Master Prompt.`,

  image: `Go deep. This is the analytical layer that will power the Master Prompt.

Cover all of:
1. **Composition rules** — rule of thirds, leading lines, symmetry, negative space
2. **Colour palette** — dominant colours, contrast, temperature, emotional associations
3. **Lighting** — source, quality, shadows, mood created
4. **Style references** — what design movement, photography school, or visual genre this evokes
5. **Focal point and hierarchy** — what the eye is drawn to first and why
6. **Why it works** — the underlying reason this image is compelling

Be specific and analytical. This output will be used to create a Master Prompt.`,

  article: `Go deep. This is the analytical layer that will power the Master Prompt.

Cover all of:
1. **Argument structure** — how is the piece organised? What's the logical flow?
2. **Rhetorical techniques** — analogies, data, storytelling, authority signals
3. **Structural patterns** — how does it open? How does it build? How does it close?
4. **Voice and register** — formal/casual, first/third person, sentence length patterns
5. **Persuasion mechanics** — what makes the reader keep going and believe the argument
6. **Why it works** — the underlying reason this piece resonates

Be specific and analytical. This output will be used to create a Master Prompt.`,
};

export function advancedInsightPrompt(
  type: ContentType,
  content: string,
  basicInsight: string,
  focusHint?: string | null
): string {
  const focusLine = focusHint
    ? `IMPORTANT: The user specifically wants to focus on: "${focusHint}". Anchor your deep analysis to this aspect.\n\n`
    : '';
  return `${focusLine}${advancedInsightInstructions[type]}

Basic insight already generated (use as context, don't repeat it):
---
${basicInsight}
---

Original content:
---
${content}
---`;
}

// ─── Phase 2 — Master Prompt ──────────────────────────────────────────────────

const masterPromptInstructions: Record<ContentType, string> = {
  image: `You are a world-class prompt engineer. Using the advanced visual analysis provided, generate a MASTER PROMPT for AI image generation.

Output ONLY a valid JSON object — no preamble, no explanation, no markdown fences. The JSON must have exactly these fields:

{
  "subject": "Precise, vivid description of the main subject, action, and scene. Be hyper-specific about what is in the frame.",
  "style": "Visual genre, art movement, photography school, or artist reference. E.g. cinematic editorial photography, Annie Leibovitz style, shot on Hasselblad.",
  "composition": "Framing, camera angle, perspective, depth of field, rule of thirds. E.g. low angle wide shot, shallow depth of field, subject left-aligned.",
  "lighting": "Light source, quality, direction, colour temperature, shadows. E.g. soft diffused side lighting, cool 4500K, subtle rim light.",
  "color_palette": "2-5 specific colours or palette descriptors. E.g. muted sage green, warm ivory, deep burnt sienna, low saturation, film-like.",
  "mood": "The emotional atmosphere and feeling of the image. 1-2 sentences.",
  "technical": "Resolution and quality modifiers. E.g. 8K ultra-detailed, photorealistic, HDR, medium format digital, sharp focus.",
  "negative_prompt": "Comma-separated list of things to exclude. E.g. cartoon, anime, illustration, distorted face, low quality, blurry, watermark, text.",
  "final_prompt": "A single, fused master prompt string combining all fields above into one powerful generation-ready prompt. 60-120 words. Can be pasted directly into Midjourney, DALL-E, Stable Diffusion, Flux, or any AI image tool. Begin with the subject, weave in style, composition, lighting, mood and technical details naturally."
}

Rules:
- Every field must be populated with rich, specific detail — no vague terms like beautiful or nice
- The final_prompt must read as professional prompt engineering output — detailed, technical, layered
- Style references should name real photographers, movements, or camera systems where relevant
- Negative prompt should pre-empt common AI failure modes for this image type`,

  video: `You are a world-class prompt engineer. Using the advanced video analysis provided, generate a MASTER PROMPT for AI video generation.

Output ONLY a valid JSON object — no preamble, no explanation, no markdown fences. The JSON must have exactly these fields:

{
  "subject": "What the video is about, who is in it, what is happening, and the setting.",
  "format": "Video length, orientation, aspect ratio, and platform target. E.g. 60 seconds, 9:16 vertical, designed for TikTok and Reels.",
  "hook": "Precise description of the first 2-3 seconds. What happens immediately to grab attention?",
  "structure": "Beat-by-beat breakdown of the video arc. E.g. Hook 0-3s then Problem 3-10s then Build 10-30s then Reveal 30-50s then CTA 50-60s.",
  "visual_style": "Shot types, camera movement, transitions, text overlay approach, colour grading.",
  "audio": "Music mood, tempo, voiceover style, sound design notes.",
  "tone": "Energy level and personality. E.g. high-energy, urgent, direct-to-camera authenticity.",
  "negative_prompt": "What to avoid. E.g. slow pacing, stock footage feel, generic music, text-heavy, corporate tone.",
  "final_prompt": "A single, detailed generation-ready prompt combining all fields. 80-150 words, written for an AI video tool like Runway, Kling, or Pika."
}`,

  article: `You are a world-class prompt engineer. Using the advanced content analysis provided, generate a MASTER PROMPT for AI writing generation.

Output ONLY a valid JSON object — no preamble, no explanation, no markdown fences. The JSON must have exactly these fields:

{
  "topic": "The precise subject and angle of the piece. Be specific about the thesis or argument.",
  "format": "Article type, approximate length, intended platform. E.g. Long-form opinion essay, 1500 words, LinkedIn or Substack.",
  "hook": "How to open the piece. A specific instruction for the opening sentence or paragraph.",
  "structure": "Section-by-section breakdown. E.g. Opening hook then Problem framing then 3 supporting arguments then Counterargument then Conclusion with CTA.",
  "tone": "Voice, register, sentence style, point of view. E.g. First-person, conversational but authoritative, short punchy sentences.",
  "rhetorical_techniques": "Specific writing techniques to deploy. E.g. Open with counter-intuitive claim, use data in sections 2 and 3, close with personal story.",
  "target_audience": "Who this is written for, their pain points, their expertise level.",
  "negative_prompt": "What to avoid. E.g. generic advice, listicle format, corporate jargon, passive voice, hedging language.",
  "final_prompt": "A single, detailed AI writing prompt combining all fields. 80-150 words, ready to paste into ChatGPT, Claude, or any AI writing tool."
}`,
};

export function briefPrompt(
  type: ContentType,
  advancedInsight: string
): string {
  return `${masterPromptInstructions[type]}

Advanced analysis to build from:
---
${advancedInsight}
---`;
}

// ─── Refinement ───────────────────────────────────────────────────────────────

export function refinePrompt(
  brief: string,
  instruction: string
): string {
  const isJson = brief.trim().startsWith('{');

  const formatRule = isJson
    ? `The Master Prompt is in JSON format. Return ONLY a valid JSON object with the same fields. Do NOT add markdown fences, preamble, or commentary. Update only the fields the instruction affects — keep all other fields intact. The final_prompt field MUST be regenerated to reflect any changes.`
    : `The Master Prompt is in plain text format. Return only the updated prompt text. Keep the same structure and format.`;

  return `You are refining a Master Prompt based on a user instruction.

${formatRule}

OPTIONAL INTERACTION: If the user's instruction is ambiguous, or you want to give them choices for the next iteration, you can append ONE JSON question card at the very end of your response (after the main output) using this exact syntax:
[[QUESTION: {"title": "Question Title", "description": "Optional description", "options": ["Option 1", "Option 2"]}]]

Current Master Prompt:
---
${brief}
---

User instruction: "${instruction}"

Return the full updated Master Prompt${isJson ? ' as valid JSON' : ''}. Do not add any commentary outside the JSON output (except the optional question card).`;
}
