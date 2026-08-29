export type ChangelogTag = "new" | "improved" | "fixed";

export interface ChangelogEntry {
  id: string;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  tag: ChangelogTag;
  body: React.ReactNode;
}

export const changelogData: ChangelogEntry[] = [
  {
    id: "v1-0-1",
    title: "Initial Beta Launch",
    date: "2026-08-29",
    tag: "new",
    body: "Welcome to Recrea8! We are thrilled to launch our beta. You can now paste links to YouTube videos, TikToks, images, or articles, and our AI will reverse-engineer them into creative briefs. No sign-up is required for your first run.",
  },
  {
    id: "performance-improvements",
    title: "Faster Processing Speeds",
    date: "2026-08-20",
    tag: "improved",
    body: "We've optimized our AI breakdown pipeline. Content processing is now up to 40% faster, meaning you get your creative briefs even quicker than before.",
  },
  {
    id: "youtube-parsing-fix",
    title: "YouTube Transcript Parsing Fix",
    date: "2026-08-15",
    tag: "fixed",
    body: "Resolved an issue where some YouTube shorts transcripts were failing to parse correctly due to auto-generated caption formatting.",
  },
];
