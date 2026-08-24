"use client";

import * as React from "react";
import { Video, FileImage, Newspaper, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ContentType = "video" | "image" | "article";

interface InspirationItem {
  id: string;
  type: ContentType;
  sourceLabel: string;
  insight: string;
  thumbnailUrl?: string; // Optional, maybe we just use gradients for now
  gradient: string;
}

const ITEMS: InspirationItem[] = [
  {
    id: "demo-1",
    type: "video",
    sourceLabel: "Viral TikTok Ad",
    insight: "Fast-paced hook with alternating tight shots and bold text overlays.",
    gradient: "from-pink-500/20 to-rose-500/20 border-pink-500/20",
  },
  {
    id: "demo-2",
    type: "image",
    sourceLabel: "SaaS Landing Page",
    insight: "High-contrast dark mode with glassmorphism and subtle glowing accents.",
    gradient: "from-blue-500/20 to-indigo-500/20 border-blue-500/20",
  },
  {
    id: "demo-3",
    type: "article",
    sourceLabel: "Substack Newsletter",
    insight: "Contrarian opening statement followed by structured, numbered arguments.",
    gradient: "from-emerald-500/20 to-teal-500/20 border-emerald-500/20",
  },
  {
    id: "demo-4",
    type: "video",
    sourceLabel: "YouTube Product Review",
    insight: "Split-screen comparison format with energetic voiceover pacing.",
    gradient: "from-orange-500/20 to-amber-500/20 border-orange-500/20",
  },
  {
    id: "demo-5",
    type: "image",
    sourceLabel: "Instagram Carousel",
    insight: "Minimalist typography focused on a single key metric per slide.",
    gradient: "from-purple-500/20 to-fuchsia-500/20 border-purple-500/20",
  },
  {
    id: "demo-6",
    type: "article",
    sourceLabel: "SEO Blog Post",
    insight: "Question-based H2s to capture long-tail search intent with clear answers.",
    gradient: "from-cyan-500/20 to-sky-500/20 border-cyan-500/20",
  },
];

const TypeIcon = ({ type, className }: { type: ContentType; className?: string }) => {
  switch (type) {
    case "video": return <Video className={className} />;
    case "image": return <FileImage className={className} />;
    case "article": return <Newspaper className={className} />;
  }
};

export function InspirationGallery() {
  const [filter, setFilter] = React.useState<ContentType | "all">("all");

  const filteredItems = ITEMS.filter(item => filter === "all" || item.type === filter);

  return (
    <div className="w-full flex flex-col gap-6 py-8">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Or start from an example
        </h2>
        <p className="text-sm text-muted-foreground">
          See how Recrea8 reverse-engineers viral content.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        {(["all", "video", "image", "article"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full transition-colors border",
              filter === t 
                ? "bg-foreground text-background border-foreground" 
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Horizontally scrollable container */}
      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 snap-x snap-mandatory hide-scrollbar">
        {filteredItems.map((item) => (
          <Card 
            key={item.id} 
            className={cn(
              "shrink-0 w-[280px] snap-center cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-gradient-to-br",
              item.gradient
            )}
            onClick={() => {
              // TODO: In v2, this could actually populate the form or navigate to a public demo session.
              // For now, it's a visual showcase of the capability.
            }}
          >
            <CardContent className="p-5 flex flex-col h-full gap-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-background/50 backdrop-blur-sm gap-1.5 font-normal">
                  <TypeIcon type={item.type} className="w-3 h-3" />
                  {item.sourceLabel}
                </Badge>
              </div>
              
              <p className="text-sm text-foreground/90 font-medium leading-relaxed flex-1 mt-2">
                &quot;{item.insight}&quot;
              </p>
              
              <div className="flex items-center text-xs font-medium text-foreground/70 group mt-4">
                See the brief 
                <ArrowRight className="w-3. h-3 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
