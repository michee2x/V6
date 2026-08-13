"use client";

import * as React from "react";
import { Copy, Download, Wand2, CheckCheck, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { cn } from "@/lib/utils";

import ReactMarkdown from "react-markdown";

interface BriefPanelProps {
  sessionId: string;
  phase: "basic" | "advanced" | "brief";
  brief: string;
  isStreamingBrief: boolean;
  briefError: string | null;
  contentType: string;
  onBriefUpdate: (updated: string) => void;
}

const modelOptions = {
  image: ["Flux Pro", "DALL·E 3"],
  video: ["Kling 2.0", "Runway Gen-4"],
  article: [],
  auto: ["Flux Pro", "DALL·E 3"],
};

/** Blinking cursor shown while a stream is active */
function StreamCursor() {
  return (
    <span className="inline-block w-[2px] h-[1em] bg-foreground ml-0.5 align-middle animate-pulse" />
  );
}

export function BriefPanel({
  sessionId,
  phase,
  brief,
  isStreamingBrief,
  briefError,
  contentType,
  onBriefUpdate,
}: BriefPanelProps) {
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [refinement, setRefinement] = React.useState("");

  const refineStream = useSSEStream();

  // The "live" brief: if refinement stream is running/done, use its text; else use original
  const liveBrief = refineStream.text || brief;
  const isRefining = refineStream.isStreaming;

  const models = modelOptions[contentType as keyof typeof modelOptions] ?? modelOptions.auto;

  const handleCopy = async () => {
    const textToCopy = liveBrief;
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Brief copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefinement = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !refinement.trim() || isRefining) return;
    const instruction = refinement.trim();
    setRefinement("");
    refineStream.reset();
    refineStream.trigger(`/api/v1/sessions/${sessionId}/refine`, {
      brief: liveBrief,
      instruction,
    });
  };

  // Empty / waiting state
  if (phase !== "brief") {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/20 gap-4 text-center">
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
            phase === "basic" ? "bg-muted" : "bg-primary/10"
          )}
        >
          <Wand2
            className={cn(
              "w-7 h-7 transition-colors",
              phase === "basic" ? "text-muted-foreground/40" : "text-primary/60"
            )}
          />
        </div>
        <p className="text-body text-muted-foreground max-w-[200px]">
          {phase === "basic"
            ? "Your creative brief will appear here once you generate it."
            : "Building your creative brief from the insights..."}
        </p>
      </div>
    );
  }

  // Error state
  if (briefError && !brief) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5 w-full">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-body">{briefError}</p>
          </div>
          <Button variant="outline" size="sm" className="self-start" onClick={() => onBriefUpdate("")}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Loading skeleton (brief requested but no text yet)
  const isLoadingSkeleton = isStreamingBrief && brief.length === 0;

  return (
    <div className="flex flex-col h-full bg-muted/20 border-l border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-h3 text-foreground">Creative Brief</h2>
        <div className="flex items-center gap-2">
          <Button
            id="copy-brief-btn"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            aria-label="Copy brief"
            disabled={!liveBrief}
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Brief text */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoadingSkeleton ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-body text-foreground leading-relaxed font-sans">
            <ReactMarkdown>{liveBrief + (isStreamingBrief || isRefining ? " ▋" : "")}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Refinement input */}
      <div className="px-6 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          {isRefining && (
            <span className="animate-spin h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full inline-block shrink-0" />
          )}
          <input
            id="brief-refinement-input"
            type="text"
            value={refinement}
            onChange={(e) => setRefinement(e.target.value)}
            onKeyDown={handleRefinement}
            placeholder='Refine: "no logo", "warmer tone", "in Spanish"...'
            className="flex-1 bg-transparent text-body placeholder:text-muted-foreground outline-none py-1"
            disabled={isRefining || isStreamingBrief}
          />
        </div>
        {refineStream.error && (
          <p className="text-caption text-destructive mt-1">{refineStream.error}</p>
        )}
      </div>

      {/* Generate actions */}
      <div className="px-6 py-4 border-t border-border flex flex-col gap-3">
        <p className="text-label text-muted-foreground">Generate with</p>

        {models.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {models.map((model) => (
              <button
                key={model}
                type="button"
                id={`model-${model.toLowerCase().replace(/\s|\./g, "-")}-btn`}
                onClick={() => setSelectedModel(model)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-label border transition-all",
                  selectedModel === model
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                {model}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            id="render-in-app-btn"
            className="w-full"
            disabled={(!selectedModel && models.length > 0) || isStreamingBrief}
            onClick={() =>
              toast.info("In-app rendering requires an account — coming soon.")
            }
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Render in-app
            {selectedModel && (
              <span className="ml-2 text-caption opacity-70">· ~15 credits</span>
            )}
          </Button>
          <Button
            id="export-prompt-btn"
            variant="outline"
            className="w-full"
            disabled={!liveBrief}
            onClick={handleCopy}
          >
            <Download className="w-4 h-4 mr-2" />
            Export prompt
          </Button>
        </div>
      </div>
    </div>
  );
}
