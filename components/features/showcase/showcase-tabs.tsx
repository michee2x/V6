"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShowcaseItem } from "./before-after-showcase";

const TABS = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "article", label: "Articles" },
] as const;

type TabKey = typeof TABS[number]["key"];

function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  const href = item.session_id ? `/session/${item.session_id}/brief/view` : undefined;

  const card = (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      {/* Before / After visuals */}
      <div className="grid grid-cols-2 min-h-[180px] relative">
        {/* Before */}
        <div className="relative bg-muted border-r border-border overflow-hidden flex items-center justify-center">
          {item.before_asset_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.before_asset_url}
              alt={item.before_label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <FileText className="w-8 h-8 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground">Source</span>
            </div>
          )}
          {/* Before label */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white/90 uppercase tracking-wider">
            {item.before_label}
          </div>
        </div>

        {/* Arrow in the middle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:border-primary transition-all">
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
        </div>

        {/* After */}
        <div className="relative bg-muted overflow-hidden flex items-center justify-center">
          {item.after_asset_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.after_asset_url}
                alt={item.after_label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {item.content_type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-8 h-8 text-white drop-shadow" />
                </div>
              )}
            </>
          ) : item.after_text_preview ? (
            <div className="p-3 text-[10px] text-muted-foreground leading-relaxed line-clamp-5 font-mono">
              {item.after_text_preview}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <FileText className="w-8 h-8 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground">Output</span>
            </div>
          )}
          {/* After label */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-primary/80 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
            {item.after_label}
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
        </div>
        {href && (
          <div className="shrink-0 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View story <ExternalLink className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export function ShowcaseTabs({ items }: { items: ShowcaseItem[] }) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("all");

  const filtered = activeTab === "all"
    ? items
    : items.filter(i => i.content_type === activeTab);

  // Only show tabs that have content
  const availableTabs = TABS.filter(
    tab => tab.key === "all" || items.some(i => i.content_type === tab.key)
  );

  return (
    <div className="w-full flex flex-col items-center gap-8 px-4">
      {/* Tab bar */}
      {availableTabs.length > 2 && (
        <div className="flex items-center gap-1 p-1 rounded-full border border-border bg-muted/30 backdrop-blur-sm">
          {availableTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Cards grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(item => (
          <ShowcaseCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
