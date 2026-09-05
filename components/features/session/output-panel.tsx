"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, ImageIcon, Video, FileText, Loader2, RefreshCw, Lock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { SessionGeneration } from "@/lib/session-store";

interface OutputPanelProps {
  sessionId: string;
  userPlan: string;
}

/** Extract the quality tier from the model string, e.g. "gpt-image-1 (medium)" → "medium" */
function getGenerationQuality(model: string): "low" | "medium" | "high" {
  const match = model.match(/\((low|medium|high)\)/);
  return (match?.[1] as "low" | "medium" | "high") ?? "low";
}

function formatExpiresIn(date: string | Date, now: number): string {
  const diffMs = new Date(date).getTime() - now;
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}hrs ${minutes}min`;
  return `${minutes}min`;
}

export function OutputPanel({ sessionId, userPlan }: OutputPanelProps) {
  const [generations, setGenerations] = React.useState<SessionGeneration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchGenerations = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/generations`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch generations");
      }
      setGenerations(data.data.generations);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  return (
    <div className="flex flex-col flex-1 max-w-5xl w-full mx-auto relative h-full">
      {/* Header */}
      <div className="px-4 md:px-8 py-3 md:py-4 border-b border-border bg-muted/30 flex items-center justify-between gap-2 md:gap-4 shrink-0">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <Link
            href={`/session/${sessionId}`}
            className="flex items-center gap-1.5 text-label text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Insights</span>
          </Link>
          <h1 className="text-h4 md:text-h3 text-foreground truncate">Output History</h1>
        </div>
        <div className="shrink-0">
          <Button variant="ghost" size="sm" onClick={fetchGenerations} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 sm:mr-2", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading && generations.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-destructive text-body">{error}</p>
            <Button variant="outline" onClick={fetchGenerations}>Retry</Button>
          </div>
        ) : generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-h4 text-foreground">No outputs yet</h3>
            <p className="text-body text-muted-foreground max-w-sm">
              Generate images, videos, or documents from your creative brief and they will appear here.
            </p>
            <Link href={`/session/${sessionId}/brief`} className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
              Go to Creative Brief
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generations.map((gen) => (
              <div key={gen.id} className="bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {gen.type === "image" && <ImageIcon className="w-4 h-4 text-primary" />}
                    {gen.type === "video" && <Video className="w-4 h-4 text-primary" />}
                    {gen.type === "document" && <FileText className="w-4 h-4 text-primary" />}
                    <span className="text-label font-medium capitalize">{gen.type}</span>
                    <span className="text-caption text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border">
                      {gen.model}
                    </span>
                  </div>
                  <span className="text-caption text-muted-foreground">
                    {new Date(gen.createdAt).toLocaleDateString()} {new Date(gen.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-center bg-muted/5 min-h-[300px]">
                  {gen.type === "image" && (() => {
                    const canDownload = true;
                    return (
                      <img
                        src={`data:${gen.mimeType || "image/png"};base64,${gen.data}`}
                        alt="Generated"
                        className="w-full h-auto rounded-md object-contain max-h-[400px] select-none"
                        onContextMenu={!canDownload ? (e) => e.preventDefault() : undefined}
                        draggable={canDownload}
                      />
                    );
                  })()}
                  {gen.type === "video" && (
                    <video 
                      src={gen.data.startsWith("http") ? gen.data : `data:${gen.mimeType || "video/mp4"};base64,${gen.data}`}
                      controls
                      className="w-full h-auto rounded-md max-h-[400px]"
                    />
                  )}
                  {gen.type === "document" && (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-body text-foreground max-h-[400px] overflow-y-auto">
                      <ReactMarkdown>{gen.data}</ReactMarkdown>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border bg-muted/10">
                  <div className="flex items-center justify-between">
                    {gen.expiresAt && (
                      <span className="text-caption text-amber-600 dark:text-amber-500">
                        Expires in: {formatExpiresIn(gen.expiresAt, now)}
                      </span>
                    )}
                    {!gen.expiresAt && (
                      <span className="text-caption text-muted-foreground">Saved permanently</span>
                    )}

                    {gen.type === "image" && (() => {
                      const canDownload = true;
                      return canDownload ? (
                        <a
                          href={`data:${gen.mimeType || "image/png"};base64,${gen.data}`}
                          download={`recrea8-${gen.id.slice(0,6)}.png`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto")}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download
                        </a>
                      ) : (
                        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-md border border-border">
                          <Lock className="w-3 h-3" />
                          <span>Upgrade to download</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}