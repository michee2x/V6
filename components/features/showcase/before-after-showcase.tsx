/**
 * components/features/showcase/before-after-showcase.tsx
 * Server component — fetches published showcase items from Supabase
 * and renders a tabbed before/after grid on the home page.
 */

import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ArrowRight, Play, FileText } from "lucide-react";
import { ShowcaseTabs } from "./showcase-tabs";

export type ShowcaseItem = {
  id: string;
  session_id: string | null;
  content_type: "image" | "video" | "article";
  title: string;
  description: string | null;
  before_label: string;
  after_label: string;
  before_asset_url: string | null;
  after_asset_url: string | null;
  after_text_preview: string | null;
};

async function getPublishedShowcase(): Promise<ShowcaseItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("showcase_items")
      .select("id, session_id, content_type, title, description, before_label, after_label, before_asset_url, after_asset_url, after_text_preview")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .limit(12);
    return (data as ShowcaseItem[]) ?? [];
  } catch {
    return [];
  }
}

export async function BeforeAfterShowcase() {
  const items = await getPublishedShowcase();

  if (items.length === 0) return null;

  return (
    <section
      id="showcase"
      className="w-full border-t border-border/40 mt-8 flex flex-col items-center gap-0"
    >
      {/* Heading */}
      <div className="flex flex-col items-center text-center gap-3 px-4 max-w-2xl py-16">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          See what&apos;s possible
        </h2>
        <p className="text-muted-foreground text-base max-w-prose">
          These are real before &amp; afters — inspiration in, finished creative out.
          Click any card to see the full creative journey.
        </p>
      </div>

      {/* Snap-scroll cards */}
      <ShowcaseTabs items={items} />
    </section>
  );
}
