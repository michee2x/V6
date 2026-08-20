"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Lightbulb, Wand2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function SessionNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract sessionId from the path: /session/[id] or /session/[id]/brief
  const match = pathname.match(/^\/session\/([^/]+)/);
  const sessionId = match?.[1] ?? null;

  // Preserve url + type params when switching tabs
  const params = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const urlParam = searchParams.get("url") || "";
  const typeParam = searchParams.get("type") || "auto";

  const insightsHref  = sessionId ? `/session/${sessionId}${params}` : "/";
  const briefHref     = sessionId ? `/session/${sessionId}/brief${params}` : "/";

  const isInsights = !!pathname.match(/^\/session\/[^/]+$/) ;
  const isBrief    = pathname.endsWith("/brief");

  return (
    <header className="border-b border-border h-14 flex items-center px-6 shrink-0 gap-6">
      {/* Logo */}
      <Link
        href="/"
        className="shrink-0 hover:opacity-70 transition-opacity flex items-center"
      >
        <img src="/logo.png" alt="recrea8" className="h-8 md:h-10" />
        <span className="sr-only">recrea8</span>
      </Link>

      {/* Phase tabs — only shown when inside a session */}
      {sessionId && (
        <nav className="flex items-center gap-1" aria-label="Session phases">
          <Link
            href={insightsHref}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label transition-all duration-150",
              isInsights
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
            aria-current={isInsights ? "page" : undefined}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Insights</span>
          </Link>

          <Link
            href={briefHref}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label transition-all duration-150",
              isBrief
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
            aria-current={isBrief ? "page" : undefined}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Creative Brief</span>
          </Link>
        </nav>
      )}

      {sessionId && urlParam && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border ml-2">
           <span className="text-caption text-muted-foreground truncate max-w-[200px]">
             {urlParam.startsWith("upload://") ? urlParam.replace("upload://", "") : (urlParam || "Uploaded file")}
           </span>
           <span className="shrink-0 inline-flex items-center rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize border border-border">
             {typeParam === "auto" ? "Detecting..." : typeParam}
           </span>
        </div>
      )}

      <div className="flex-1" />

      {/* New session */}
      <Link
        href="/"
        className="flex items-center gap-1.5 text-label text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <span className="hidden sm:inline">← New session</span>
        <Plus className="w-4 h-4 sm:hidden" />
      </Link>
    </header>
  );
}
