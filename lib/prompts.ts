/**
 * lib/prompts.ts
 *
 * All Claude prompt templates for v6.
 * Every AI behaviour in the app flows through this file — tune here, not in routes.
 */

import type { ContentType } from "./session-store";

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
  content: string
): string {
  return `${basicInsightInstructions[type]}

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
  basicInsight: string
): string {
  return `${advancedInsightInstructions[type]}

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
  video: `Convert the advanced insights into a production-ready creative brief for a VIDEO inspired by (not identical to) the analysed content.

Frame everything as "inspired by" — generalise techniques, never reproduce specific content.

Structure the brief as:
**Format:** [length, orientation, platform target]
**Tone & Energy:** [delivery style, pacing feel]
**Opening Hook:** [first 2–3 seconds — be specific about what happens]
**Structure:** [beat-by-beat outline, 4–6 beats]
**Visual Style:** [shot types, editing techniques, text overlay approach]
**Audio:** [music mood, VO style if applicable]
**CTA / Close:** [how it ends]

Then add a single line: _"Refine this brief: tell me your product, target audience, or any style changes."_`,

  image: `Convert the advanced insights into a production-ready creative brief for an IMAGE inspired by (not identical to) the analysed content.

Frame everything as "inspired by" — generalise techniques, never reproduce specific content.

Structure the brief as:
**Format:** [dimensions, orientation, use case]
**Subject:** [what to depict]
**Composition:** [layout approach, focal point]
**Colour Palette:** [2–4 specific colours or palette description]
**Lighting:** [quality, direction, mood]
**Style:** [visual genre or reference point]
**Mood:** [emotional target]

Then add a single line: _"Refine this brief: tell me your subject, brand colours, or any style changes."_`,

  article: `Convert the advanced insights into a production-ready creative brief for a PIECE OF WRITING inspired by (not identical to) the analysed content.

Frame everything as "inspired by" — generalise techniques, never reproduce specific content.

Structure the brief as:
**Format:** [article type, approximate length, platform]
**Central Argument / Thesis:** [1–2 sentences]
**Opening Hook:** [how to start — specific approach]
**Structure:** [3–5 key sections or beats]
**Tone & Voice:** [register, person, sentence style]
**Rhetorical Approach:** [what techniques to deploy]
**Close:** [how to end it]

Then add a single line: _"Refine this brief: tell me your topic, audience, or any structural changes."_`,
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

Current brief:
---
${brief}
---

User instruction: "${instruction}"

Return the full updated brief. Do not add commentary — just the brief.`;
}
