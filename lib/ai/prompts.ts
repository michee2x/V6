/**
 * lib/prompts.ts
 *
 * All Claude prompt templates for v6.
 * Every AI behaviour in the app flows through this file — tune here, not in routes.
 */

import type { ContentType } from "../session-store";

// ─── Shared system prompt ─────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are an expert content analyst and creative strategist for v6, a tool that helps people understand content deeply and create inspired work from it.

Your job is to analyse content and help users both understand what makes it work AND create their own inspired version of it. 

Rules:
- Be direct and specific — no filler phrases like "certainly!" or "great question"
- Write in plain, clean prose. No excessive bullet padding.
- Never reproduce copyrighted content verbatim — generalise and inspire, don't copy
- When generating creative briefs, frame everything as "inspired by" not "copy of"`;

// ─── Phase 1 — Basic Insight ──────────────────────────────────────────────────

const basicInsightInstructions: Record<ContentType, string> = {
  video: `Provide a fast, clear breakdown covering:
- What the video is about (1–2 sentences)
- Who's in it / who made it
- The format and rough pacing (e.g. talking head, montage, tutorial)
- The main takeaway or message

Keep it tight — this is the "get your bearings in 10 seconds" layer. 3–5 short paragraphs max.`,

  image: `Provide a fast, clear breakdown covering:
- What the subject is
- The visual style and mood
- Key compositional choices
- What makes it immediately striking

Keep it tight — this is the "get your bearings in 10 seconds" layer. 3–5 short paragraphs max.`,

  article: `Provide a fast, clear breakdown covering:
- The central thesis or main argument
- The 3–4 most important points made
- The tone and intended audience
- The key takeaway

Keep it tight — this is the "get your bearings in 10 seconds" layer. 3–5 short paragraphs max.`,
};

export function basicInsightPrompt(
  type: ContentType,
  content: string,
  focusHint?: string | null
): string {
  const focusLine = focusHint
    ? `IMPORTANT: The user specifically wants to focus on: "${focusHint}". Keep your entire analysis centred on this aspect.\n\n`
    : "";
  return `${focusLine}${basicInsightInstructions[type]}

Content to analyse:
---
${content}
---`;
}

// ─── Phase 1.5 — Advanced Insights ───────────────────────────────────────────

const advancedInsightInstructions: Record<ContentType, string> = {
  video: `Go deep. This is the analytical layer that will power the creative brief.

Cover all of:
1. **Shot structure** — how is the video visually constructed? Scene types, angles, transitions.
2. **Pacing & edit rhythm** — cuts per minute, tempo, where it breathes vs. rushes
3. **Voiceover / on-camera tone** — delivery style, energy, personality markers
4. **Editing techniques** — text overlays, motion graphics, sound design, music use
5. **Hook mechanics** — what exactly happens in the first 3 seconds and why it works
6. **Why it works** — the underlying psychological or structural reason this content performs

Be specific and analytical. This output will be used to create a creative brief.`,

  image: `Go deep. This is the analytical layer that will power the creative brief.

Cover all of:
1. **Composition rules** — rule of thirds, leading lines, symmetry, negative space
2. **Colour palette** — dominant colours, contrast, temperature, emotional associations
3. **Lighting** — source, quality, shadows, mood created
4. **Style references** — what design movement, photography school, or visual genre this evokes
5. **Focal point & hierarchy** — what the eye is drawn to first and why
6. **Why it works** — the underlying reason this image is compelling

Be specific and analytical. This output will be used to create a creative brief.`,

  article: `Go deep. This is the analytical layer that will power the creative brief.

Cover all of:
1. **Argument structure** — how is the piece organised? What's the logical flow?
2. **Rhetorical techniques** — analogies, data, storytelling, authority signals
3. **Structural patterns** — how does it open? How does it build? How does it close?
4. **Voice & register** — formal/casual, first/third person, sentence length patterns
5. **Persuasion mechanics** — what makes the reader keep going and believe the argument
6. **Why it works** — the underlying reason this piece resonates

Be specific and analytical. This output will be used to create a creative brief.`,
};

export function advancedInsightPrompt(
  type: ContentType,
  content: string,
  basicInsight: string,
  focusHint?: string | null
): string {
  const focusLine = focusHint
    ? `IMPORTANT: The user specifically wants to focus on: "${focusHint}". Anchor your deep analysis to this aspect.\n\n`
    : "";
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

// ─── Phase 2 — Creative Brief ─────────────────────────────────────────────────

const briefInstructions: Record<ContentType, string> = {
  video: `Convert the advanced insights into a PRODUCTION-READY AI VIDEO BRIEF — formatted as a clean, plain-text prompt that can be pasted directly into any AI video generation tool (Runway, Kling, Pika, etc.) or handed to a director.

DO NOT use Markdown. No asterisks, no bold, no bullet dashes, no headers with hashtags.
Write in flowing, structured plain text using clear section labels followed by a colon and the value on the same line.

Output format:

FORMAT: [length, orientation, platform target]
TONE AND ENERGY: [delivery style, pacing feel]
OPENING HOOK: [first 2–3 seconds — be specific about what happens]
STRUCTURE: [beat-by-beat outline, 4–6 beats separated by forward slashes or semicolons]
VISUAL STYLE: [shot types, editing techniques, text overlay approach]
AUDIO: [music mood, VO style if applicable]
CALL TO ACTION: [how it ends]

Then add this line exactly:
Refine this brief: tell me your product, target audience, or any style changes.`,

  image: `Convert the advanced insights into a PRODUCTION-READY AI IMAGE PROMPT — formatted as clean, plain text that can be pasted directly into Midjourney, DALL-E, Flux, Stable Diffusion, or any other image generation tool.

DO NOT use Markdown. No asterisks, no bold, no bullet dashes, no headers with hashtags.
Write in flowing, structured plain text using clear section labels followed by a colon and the value on the same line.

Output format:

FORMAT: [dimensions, orientation, use case]
SUBJECT: [what to depict, in vivid, specific detail]
COMPOSITION: [layout approach, focal point, framing]
COLOUR PALETTE: [2–4 specific colours or palette description]
LIGHTING: [quality, direction, mood]
STYLE: [visual genre or reference point — e.g. "Karsh portrait photography, mid-century editorial"]
MOOD: [emotional target, one or two sentences]

Then add this line exactly:
Refine this brief: tell me your subject, brand colours, or any style changes.`,

  article: `Convert the advanced insights into a PRODUCTION-READY AI WRITING BRIEF — formatted as clean, plain text that can be pasted directly into ChatGPT, Claude, or any AI writing tool.

DO NOT use Markdown. No asterisks, no bold, no bullet dashes, no headers with hashtags.
Write in flowing, structured plain text using clear section labels followed by a colon and the value on the same line.

Output format:

FORMAT: [article type, approximate length, platform]
CENTRAL ARGUMENT: [1–2 sentences summarising the core thesis]
OPENING HOOK: [how to start — specific approach]
STRUCTURE: [3–5 key sections or beats separated by forward slashes or semicolons]
TONE AND VOICE: [register, person, sentence style]
RHETORICAL APPROACH: [what techniques to deploy]
CLOSING: [how to end it]

Then add this line exactly:
Refine this brief: tell me your topic, audience, or any structural changes.`,
};

export function briefPrompt(
  type: ContentType,
  advancedInsight: string
): string {
  return `${briefInstructions[type]}

Advanced insights to build from:
---
${advancedInsight}
---`;
}

// ─── Refinement ───────────────────────────────────────────────────────────────

export function refinePrompt(
  brief: string,
  instruction: string
): string {
  return `You are refining a creative brief based on a user instruction. Update only the parts the instruction affects — keep everything else intact.

CRITICAL: The brief MUST stay in clean plain text format. No Markdown. No asterisks, no bold (**), no bullet dashes, no hashtag headers. Use the same UPPERCASE LABEL: value format as the original brief.

Current brief:
---
${brief}
---

User instruction: "${instruction}"

Return the full updated brief. Do not add commentary — just the brief.`;
}
