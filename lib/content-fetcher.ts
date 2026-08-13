/**
 * lib/content-fetcher.ts
 *
 * Fetches and extracts content for each supported type.
 * All functions run server-side only (called from API route handlers).
 */

import type { ContentType } from "./session-store";

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

// ─── Video (YouTube / TikTok via oEmbed) ─────────────────────────────────────

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
  provider_name?: string;
  type?: string;
  description?: string;
}

async function fetchYouTubeOEmbed(url: string): Promise<string> {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`YouTube oEmbed failed: ${res.status}`);
  const data: OEmbedResponse = await res.json();
  return [
    `Title: ${data.title ?? "Unknown"}`,
    `Channel: ${data.author_name ?? "Unknown"}`,
    `Platform: YouTube`,
  ].join("\n");
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

export async function fetchVideoMetadata(url: string): Promise<string> {
  if (/youtube\.com|youtu\.be/i.test(url)) return fetchYouTubeOEmbed(url);
  if (/tiktok\.com/i.test(url)) return fetchTikTokOEmbed(url);
  // Generic video URL — just return the URL itself for Claude to work with
  return `Video URL: ${url}`;
}

// ─── Image (fetch + base64) ───────────────────────────────────────────────────

export interface ImageData {
  base64: string;
  mimeType: string;
}

export async function fetchImageAsBase64(url: string): Promise<ImageData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const mimeType = contentType.split(";")[0].trim();

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return { base64, mimeType };
}

// ─── Article (fetch HTML → strip to text) ────────────────────────────────────

function stripHtml(html: string): string {
  return html
    // Remove script and style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Replace block-level tags with newlines for readability
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article)>/gi, "\n")
    // Strip all remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Collapse excessive whitespace
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
  // Truncate to ~12,000 chars to stay within reasonable Claude context
  return text.slice(0, 12000);
}
