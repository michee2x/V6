"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import type { ShowcaseItem } from "./before-after-showcase";

function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  const href = item.session_id ? `/session/${item.session_id}/brief/view` : undefined;

  const card = (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer w-full max-w-2xl mx-auto">
      {/* Before / After visuals */}
      <div className="grid grid-cols-2 min-h-[260px] sm:min-h-[320px] relative">
        {/* Before */}
        <div className="relative bg-muted border-r border-border overflow-hidden flex items-center justify-center">
          {item.before_asset_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.before_asset_url} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground/50">
              <ImageIcon className="w-8 h-8 mb-1.5" />
              <span className="text-xs text-muted-foreground">Source</span>
            </div>
          )}
          {/* Before label */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white/90 uppercase tracking-wider">
            {item.before_label || "Original"}
          </div>
        </div>

        {/* Arrow in the middle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:border-primary transition-all duration-200">
          <ArrowRight className="w-4 h-4 text-primary" />
        </div>

        {/* After */}
        <div className="relative bg-muted overflow-hidden flex items-center justify-center">
          {item.after_asset_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.after_asset_url}
                alt={item.after_label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {item.content_type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-10 h-10 text-white drop-shadow" />
                </div>
              )}
            </>
          ) : item.after_text_preview ? (
            <div className="p-4 text-[11px] text-muted-foreground leading-relaxed line-clamp-6 font-mono">
              {item.after_text_preview}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">Output</span>
            </div>
          )}
          {/* After label */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-primary/80 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
            {item.after_label || "Recrea8'd"}
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
        </div>
        {href && (
          <div className="shrink-0 flex items-center gap-1.5 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View story <ExternalLink className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href} className="block w-full">{card}</Link> : card;
}

export function ShowcaseTabs({ items }: { items: ShowcaseItem[] }) {
  return (
    /*
     * Outer wrapper: vertical snap-scroll container.
     * Each child is a full-viewport-height slot so only one card
     * is visible at a time when scrolled to it.
     */
    <div
      className="w-full overflow-y-auto snap-y snap-mandatory"
      style={{ maxHeight: "100vh" }}
    >
      {items.map((item) => (
        /*
         * Each slot is exactly 100vh tall.
         * The card sits centered inside it — the whitespace above
         * and below pushes adjacent cards out of the viewport.
         */
        <div
          key={item.id}
          className="snap-center flex items-center justify-center w-full px-4 sm:px-8"
          style={{ height: "100vh" }}
        >
          <ShowcaseCard item={item} />
        </div>
      ))}
    </div>
  );
}
