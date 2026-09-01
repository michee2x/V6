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
  image: `You are a world-class prompt engineer and creative director. Using the advanced visual analysis provided, generate a MASTER PROMPT for AI image generation.

Output ONLY a beautifully formatted Markdown document. Do not output JSON.
Use the following structure and be hyper-specific, highly detailed, and professional (like a senior brand designer's brief):

## CANVAS & FORMAT
Describe the composition, aspect ratio, orientation, negative space, and resolution.

## OVERALL VISUAL CONCEPT
Describe the core visual idea and what the design consists of.

## BACKGROUND
Describe the background colors, gradients, textures, or subtle shapes.

## SUBJECT & BRANDING
Describe the main subject, logo placement, typography, or UI elements.

## LIGHTING & MOOD
Describe the light source, quality, shadows, elevation depth, and emotional atmosphere.

## IMPORTANT DESIGN RULES
A bulleted list of constraints (e.g., preservation of whitespace, things to avoid like 3D or stock feel).

## FINAL PROMPT
A single, fused master prompt string combining all fields above into one powerful generation-ready directive. Must begin with a directive like "Create an image..." or "Create a premium promotional banner..." 80-150 words. Can be pasted directly into Midjourney, DALL-E, Imagen, Flux, or any AI image tool. Ensure it weaves in subject, style, composition, lighting, and technical details naturally.`,

  video: `You are a world-class prompt engineer and creative director. Using the advanced video analysis provided, generate a MASTER PROMPT for AI video generation.

Output ONLY a beautifully formatted Markdown document. Do not output JSON.
Use the following structure and be highly detailed:

## VIDEO FORMAT & TARGET
Describe the length, aspect ratio, and platform target.

## OVERALL CONCEPT
Describe the core narrative or visual idea.

## VISUAL STYLE
Describe shot types, camera movement, transitions, and colour grading.

## STRUCTURE & HOOK
Beat-by-beat breakdown. Emphasize the first 3 seconds (the hook).

## AUDIO & TONE
Describe the music mood, voiceover style, and energy level.

## IMPORTANT DESIGN RULES
A bulleted list of things to avoid (e.g., slow pacing, stock footage feel).

## FINAL PROMPT
A single, detailed generation-ready directive starting with "Create a video...". 80-150 words, written for an AI video tool like Runway, Kling, or Pika.`,

  article: `You are a world-class prompt engineer. Using the advanced content analysis provided, generate a MASTER PROMPT for AI writing generation.

Output ONLY a beautifully formatted Markdown document. Do not output JSON.
Use the following structure:

## TOPIC & FORMAT
The precise subject, thesis, format, and approximate length.

## OVERALL CONCEPT
The core argument and angle.

## TARGET AUDIENCE
Who this is written for and their expertise level.

## STRUCTURE & HOOK
Section-by-section breakdown, including a specific opening hook.

## TONE & RHETORIC
Voice, register, sentence style, and specific rhetorical techniques to deploy.

## IMPORTANT WRITING RULES
A bulleted list of things to avoid (e.g., generic advice, corporate jargon, passive voice).

## FINAL PROMPT
A single, detailed AI writing directive starting with "Write a...". 80-150 words, ready to paste into an AI writing tool.`
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
  const formatRule = `The Master Prompt is in standard Markdown format. Return only the updated prompt text. Keep the same structure and headings. Ensure the ## FINAL PROMPT section is updated to reflect any new changes.`;

  return `You are refining a Master Prompt based on a user instruction.

${formatRule}

OPTIONAL INTERACTION: If the user's instruction is ambiguous, or you want to give them choices for the next iteration, you can append ONE JSON question card at the very end of your response (after the main output) using this exact syntax:
[[QUESTION: {"title": "Question Title", "description": "Optional description", "options": ["Option 1", "Option 2"]}]]

Current Master Prompt:
---
${brief}
---

User instruction: "${instruction}"

Return the full updated Master Prompt. Do not add any commentary outside the output (except the optional question card).`;
}
