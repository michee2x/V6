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
4. **Subject Identity & Actions** — precise demographics (race, age, gender), exact poses, clothing, and spatial positioning of all subjects.
5. **Editing techniques** — text overlays, motion graphics, sound design, music use
6. **Hook mechanics** — what exactly happens in the first 3 seconds and why it works
7. **Why it works** — the underlying psychological or structural reason this content performs

Be specific and analytical. This output will be used to create a Master Prompt.`,

  image: `Do NOT summarize. This is the analytical layer that will power the Master Prompt. Imagine you are instructing a blind artist to perfectly recreate this image pixel by pixel, OR to use it creatively in synergy with a new concept (like character consistency, style transfer, structural reference, or direct manipulation). Perform a microscopic visual extraction.

Cover all of:
1. **Composition rules** — rule of thirds, leading lines, symmetry, negative space
2. **Colour palette** — dominant colours, contrast, temperature, emotional associations
3. **Lighting** — source, quality, shadows, mood created
4. **Subject Identity & Actions** — precise demographics (race, age, gender), exact poses, and spatial positioning of all subjects.
5. **Exhaustive Micro-Details** — List every single texture, accessory, jewelry, fabric fold, subtle anomaly, or secondary element. If it's a person, list every ring, necklace, watch, and eyewear. If it's a landscape or object, list every background element, tiny detail, and texture. Missing any small feature is a failure.
6. **Style references** — what design movement, photography school, or visual genre this evokes
7. **Focal point and hierarchy** — what the eye is drawn to first and why
8. **Transformation & Synergy Map** — if an image is provided alongside a user instruction, analyze how they should interact. Should the image be used for a direct manipulation (like a face swap), as a style reference, as a structural pose reference, or for character consistency in a new environment?

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
  image: `You are a world-class prompt engineer and senior creative director. Your output will be used verbatim as a production brief by a designer or fed directly into an AI image generation tool. Quality and precision are non-negotiable.

Using the advanced visual analysis provided, produce an exhaustive, hyper-specific MASTER PROMPT. Think of yourself as writing an art-direction document for a high-end commercial shoot — every decision must be named and justified. Do NOT summarize or compress details.

Crucially, if the user's intent implies a synergy between an uploaded image and a text prompt (e.g., replacing a face, style transfer, using the image as a character reference in a new scene, or structural layout), your prompt must explicitly direct the AI on how to blend them. You must clearly delineate what acts as the reference, what is being changed or generated from scratch, and what must remain untouched.

Output ONLY a strict JSON object wrapped in a markdown code block (e.g. \`\`\`json ... \`\`\`). Do not add preamble or commentary. Follow this exact schema:

{
  "overview": "A 2-3 sentence human-readable summary of the overall scene, mood, and concept.",
  "global_metadata": {
    "aspect_ratio": "Exact aspect ratio (e.g. 16:9, 1:1, 4:5)",
    "lighting": "Detailed lighting source, quality, shadows, and dynamic range",
    "style": "Visual genre, photography school, resolution feel (e.g. ultra-sharp commercial, 35mm film)",
    "color_palette": ["List", "Dominant", "Colors", "With", "Hex", "Values"]
  },
  "spatial_layout": {
    "primary_focal_subjects": [
      {
        "type": "human | object | text | ui | nature",
        "exhaustive_appearance": "Microscopic breakdown of textures, materials, colors, and specific nuances.",
        "micro_details_and_accessories": "List every single tiny detail attached to this subject (jewelry, specific trims, unique markings, subtle textures, text, watches, necklaces). If none, state 'None'."
      }
    ],
    "secondary_and_background_elements": [
      {
        "type": "environment | abstract | secondary_object",
        "exhaustive_description": "List all background objects, environmental props, subtle anomalies, or minor elements that would usually be ignored."
      }
    ]
  },
  "multimodal_directives": {
    "is_multimodal": "boolean - true if using an uploaded image as a reference alongside a text prompt.",
    "reference_type": "How the image is used: 'direct_manipulation' (modifying the image itself), 'style_reference' (borrowing the art style), 'character_reference' (retaining the subject in a new scene), 'structural_reference' (borrowing pose/layout), or 'concept_blending'. Null if not multimodal.",
    "image_contribution": "Exactly what the AI should extract and keep from the reference image (e.g., 'the exact face', 'the lighting and mood', 'the pose'). Null if not multimodal.",
    "text_contribution": "What the text prompt introduces that changes or builds upon the image (e.g., 'change shirt to blue polo', 'move the character to a cyberpunk city'). Null if not multimodal.",
    "preservation_rules": "If manipulating the original image, what MUST NOT change (e.g., 'Preserve the original background'). Null if creating a new scene."
  },
  "design_rules": [
    "List of hard constraints — what the AI must and must not do."
  ],
  "final_prompt": "A single, densely packed, generation-ready master prompt string. There is NO length limit. Write as much as needed to capture 100% of the micro-details. If this is a multimodal task (using an image as a reference), you MUST explicitly start the prompt with clear directives on how to blend the image and text (e.g., what to extract from the image, what to alter, what to generate from scratch). It MUST weave together all the exhaustive appearance details, every single accessory/micro-detail, lighting, color, and background elements into a flowing narrative paragraph. DO NOT summarize. Use advanced prompt syntax."
}`,

  video: `You are a world-class prompt engineer and senior creative director. Your output will be used verbatim as a production brief for an AI video generation tool. Quality and precision are non-negotiable.

Using the advanced video analysis provided, produce an exhaustive, hyper-specific MASTER PROMPT. Think of yourself as writing a director's shot list and mood board brief — every second, every cut, every sound decision must be named.

Output ONLY a strict JSON object wrapped in a markdown code block (e.g. \`\`\`json ... \`\`\`). Do not add preamble or commentary. Follow this exact schema:

{
  "overview": "3-5 sentences describing the narrative arc, big idea, and the emotion the viewer should feel.",
  "global_metadata": {
    "duration": "Exact duration (e.g. 15s, 30s)",
    "aspect_ratio": "e.g. 16:9 landscape, 9:16 vertical",
    "frame_rate_feel": "e.g. cinematic 24fps, hyper-real 60fps",
    "visual_style": "Camera style, transitions, color grade, motion graphics"
  },
  "spatial_layout": {
    "subjects": [
      {
        "type": "human | object",
        "demographics": "If human: exact race, age, gender. Else: null",
        "appearance": "Wardrobe, physical attributes",
        "movement": "Exact movement or action performed"
      }
    ]
  },
  "audio_and_tone": {
    "music": "Genre, tempo, instrumentation",
    "sound_design": "Key SFX, ambience, voiceover style"
  },
  "beat_by_beat_breakdown": [
    {
      "timecode": "e.g. 0:00-0:03",
      "description": "What happens visually and aurally (e.g. Hook)"
    }
  ],
  "final_prompt": "A single, densely packed, generation-ready master prompt string for AI video tools (Runway, Sora, etc.). There is NO length limit. Write as much as needed to capture 100% of the visual and action details. It MUST weave together the exact demographics, actions, camera movements, style, and tone into a flowing narrative paragraph. DO NOT summarize."
}`,

  article: `You are a world-class prompt engineer and editorial strategist. Your output will be used verbatim as a writing brief for an AI writing tool or human writer. Quality and specificity are non-negotiable.

Using the advanced content analysis provided, produce an exhaustive, hyper-specific MASTER PROMPT. Think of yourself as writing a full editorial brief from an editor-in-chief — every structural, rhetorical, and stylistic decision must be named and motivated.

Output ONLY a beautifully structured Markdown document. Do not add preamble, commentary, or JSON. Follow this exact section structure:

---

## TOPIC & FORMAT
- Precise subject: one sharp sentence stating what this piece is about.
- Thesis or central claim: the single argument the piece makes.
- Format: long-form essay, listicle, how-to guide, op-ed, case study, newsletter, thread, etc.
- Approximate word count and reading time target.
- Publication context: where would this live? (LinkedIn, Substack, magazine, blog, X/Twitter thread)

## OVERALL CONCEPT & ANGLE
3–5 sentences on the big idea, the unique angle, and what makes this piece different from the 100 other articles on the same topic. What does the reader believe at the start vs. what do they believe by the end?

## TARGET AUDIENCE
- Demographic and psychographic profile (be specific: not "marketers" but "early-stage SaaS founders who've hit their first $10K MRR and are wondering why growth has stalled").
- Expertise level: novice / practitioner / expert.
- What the reader is hoping to get from this piece.
- What frustration or question brings them to it.

## STRUCTURE & HOOK
- Opening hook type: bold claim, counterintuitive stat, personal story, provocative question — describe the exact hook to use.
- Section-by-section breakdown (numbered, with a sentence on what each section does):
  1. Hook / Opening — [describe]
  2. Setup / Problem — [describe]
  3. Main argument or insight — [describe]
  4. Evidence / examples — [describe]
  5. Counterargument address (if applicable)
  6. Conclusion / CTA
- How the piece closes: call to action, open question, memorable final line style.

## TONE & RHETORIC
- Voice register: formal / conversational / intimate / authoritative / provocative.
- Person: first-person singular, first-person plural, second-person ("you"), third-person.
- Sentence rhythm: short punchy sentences, long complex constructions, or mixed.
- Specific rhetorical devices to deploy: analogies, data points, storytelling, authority signals, rhetorical questions — name which and when.
- Vocabulary level: accessible / precise technical / elevated literary.

## IMPORTANT WRITING RULES
- **Must**: [specific requirements from the source material's style]
- **Must NOT**: [e.g. "no generic listicle filler", "no corporate jargon", "no passive voice", "no hedging language", "do not start with 'In today's world'"]

## FINAL PROMPT
Write a single, densely packed, generation-ready writing directive.
- Start with: "Write a [format] about..."
- Include: topic, angle, audience, structure, tone, rhetorical techniques, word count.
- Aim for 200–350 words in flowing, directive prose.
- End with quality notes: "Do not use filler phrases. Every sentence must earn its place. No generic advice. Be specific and original."`
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
  const formatRule = `The Master Prompt is a strict JSON object wrapped in a markdown code block (\`\`\`json ... \`\`\`). Return only the updated JSON block. Keep the exact same JSON schema structure. Ensure the "final_prompt" field is updated to deeply integrate any new changes.`;

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
