/**
 * lib/content-fetcher.ts
 *
 * Fetches and extracts content for each supported type.
 * All functions run server-side only (called from API route handlers).
 */

import type { ContentType } from "./session-store";
import { YoutubeTranscript } from "youtube-transcript";

// ─── Type Detection ───────────────────────────────────────────────────────────

const VIDEO_PATTERNS = [
  /youtube\.com\/watch/i,
  /youtu\.be\//i,
  /tiktok\.com\//i,
  /vimeo\.com\//i,
];

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|svg|bmp)(\?.*)?$/i;

export function detectContentType(url: string): ContentType {
  try {
    const parsed = new URL(url);
    const href = parsed.href;

    if (VIDEO_PATTERNS.some((p) => p.test(href))) return "video";
    if (IMAGE_EXTENSIONS.test(parsed.pathname)) return "image";
    return "article";
  } catch {
    return "article";
  }
}

export function validateUrlSupport(url: string): void {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const unsupported = [
      "x.com", "twitter.com", "instagram.com", "twitch.tv", "facebook.com", "linkedin.com"
    ];
    if (unsupported.includes(host)) {
      throw new Error(`Links from ${host} are not supported yet because they require login to read. Please paste a YouTube, TikTok, or article URL instead.`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("not supported yet")) throw e;
  }
}

// ─── Video metadata ───────────────────────────────────────────────────────────

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
  provider_name?: string;
  type?: string;
  description?: string;
}

/**
 * Extracts the YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (/youtube\.com/i.test(parsed.hostname)) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      // Handle /shorts/ID and /embed/ID paths
      const pathMatch = parsed.pathname.match(/\/(shorts|embed|v)\/([a-zA-Z0-9_-]{11})/);
      if (pathMatch) return pathMatch[2];
    }
    if (/youtu\.be/i.test(parsed.hostname)) {
      const id = parsed.pathname.slice(1).split("?")[0];
      if (id.length === 11) return id;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches YouTube video content.
 * Returns metadata + transcript (for text-based models).
 * Also returns the videoId so callers can use Gemini for richer visual analysis.
 */
async function fetchYouTubeContent(url: string): Promise<{
  text: string;
  videoId: string | null;
  thumbnailUrl: string | null;
}> {
  let title = "Unknown Title";
  let channel = "Unknown Channel";
  let thumbnailUrl: string | null = null;
  const videoId = extractYouTubeVideoId(url);

  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data: OEmbedResponse = await res.json();
      title = data.title ?? title;
      channel = data.author_name ?? channel;
      thumbnailUrl = data.thumbnail_url ?? null;
    }
  } catch {
    // Ignore oEmbed errors
  }

  let transcriptText = "";
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    transcriptText = transcript.map(t => t.text).join(" ");
  } catch {
    transcriptText = "[No transcript available or subtitles are disabled for this video.]";
  }

  const text = [
    `Title: ${title}`,
    `Channel: ${channel}`,
    `Platform: YouTube`,
    videoId ? `Video ID: ${videoId}` : "",
    `\nTranscript:\n${transcriptText}`
  ].filter(Boolean).join("\n");

  return { text, videoId, thumbnailUrl };
}

async function fetchTikTokOEmbed(url: string): Promise<string> {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`TikTok oEmbed failed: ${res.status}`);
  const data: OEmbedResponse = await res.json();
  return [
    `Title: ${data.title ?? "Unknown"}`,
    `Author: ${data.author_name ?? "Unknown"}`,
    `Platform: TikTok`,
  ].join("\n");
}

/**
 * Fetches video metadata. Returns an object with:
 * - `text`: the text content to pass to the AI (transcript + metadata)
 * - `videoId`: YouTube video ID if available (for Gemini visual analysis)
 * - `thumbnailUrl`: URL of the video thumbnail if available
 */
export async function fetchVideoMetadata(url: string): Promise<{
  text: string;
  videoId: string | null;
  thumbnailUrl: string | null;
}> {
  if (/youtube\.com|youtu\.be/i.test(url)) return fetchYouTubeContent(url);
  if (/tiktok\.com/i.test(url)) {
    const text = await fetchTikTokOEmbed(url);
    return { text, videoId: null, thumbnailUrl: null };
  }
  return { text: `Video URL: ${url}`, videoId: null, thumbnailUrl: null };
}

// ─── Image (fetch + base64) ───────────────────────────────────────────────────

export interface ImageData {
  base64: string;
  mimeType: string;
}

export async function fetchImageAsBase64(url: string): Promise<ImageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);

  let contentType = res.headers.get("content-type");
  let mimeType = contentType ? contentType.split(";")[0].trim() : "";

  if (!mimeType || mimeType === "application/octet-stream") {
    const extMatch = url.match(/\.(jpe?g|png|gif|webp)(?:\?.*)?$/i);
    if (extMatch) {
      const ext = extMatch[1].toLowerCase();
      if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "png") mimeType = "image/png";
      else if (ext === "gif") mimeType = "image/gif";
      else if (ext === "webp") mimeType = "image/webp";
    }
  }

  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(mimeType)) {
    mimeType = "image/jpeg";
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return { base64, mimeType };
}

// ─── Article (fetch HTML → strip to text) ────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function fetchArticleText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; v6-bot/1.0; +https://v6.app)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Article fetch failed: ${res.status}`);
  const html = await res.text();
  const text = stripHtml(html);
  return text.slice(0, 12000);
}
