"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Copy, Download, Wand2, CheckCheck, AlertCircle, RefreshCw, ArrowLeft, Settings2, ArrowUp, Paperclip, X
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface BriefPanelProps {
  sessionId: string;
  contentType: string;
}

const modelOptions: Record<string, string[]> = {
  image:   ["Flux Pro", "DALL·E 3"],
  video:   ["Kling 2.0", "Runway Gen-4"],
  article: [],
  auto:    ["Flux Pro", "DALL·E 3"],
};

export function BriefPanel({ sessionId, contentType }: BriefPanelProps) {
  const searchParams = useSearchParams();
  const briefStream  = useSSEStream();
  const refineStream = useSSEStream();

  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [refinement, setRefinement] = React.useState("");
  const [refinementImage, setRefinementImage] = React.useState<{ mimeType: string; base64: string } | null>(null);
  const [hastriggered, setHasTriggered] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const base64Data = base64Url.split(',')[1];
      setRefinementImage({ mimeType: file.type, base64: base64Data });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Auto-trigger the brief stream on mount (once)
  React.useEffect(() => {
    if (!hastriggered) {
      setHasTriggered(true);
      briefStream.trigger(`/api/v1/sessions/${sessionId}/brief`, {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const liveBrief  = refineStream.text || briefStream.text;
  const isRefining = refineStream.isStreaming;
  const models     = modelOptions[contentType] ?? modelOptions.auto;

  // Insights back link — preserve search params
  const params       = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const insightsHref = `/session/${sessionId}${params}`;

  const handleCopy = async () => {
    if (!liveBrief) return;
    await navigator.clipboard.writeText(liveBrief);
    setCopied(true);
    toast.success("Brief copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const submitRefinement = () => {
    if (!refinement.trim() || isRefining) return;
    const instruction = refinement.trim();
    setRefinement("");
    refineStream.reset();
    refineStream.trigger(`/api/v1/sessions/${sessionId}/refine`, {
      brief: liveBrief,
      instruction,
      image: refinementImage,
    });
    setRefinementImage(null);
  };

  const handleRefinement = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitRefinement();
    }
  };

  const isLoadingSkeleton = briefStream.isStreaming && briefStream.text.length === 0;

  // ── Error state ────────────────────────────────────────────────────────────
  if (briefStream.error && !briefStream.text) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-8 gap-6">
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5 w-full max-w-md">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-body">{briefStream.error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => {
              briefStream.reset();
              briefStream.trigger(`/api/v1/sessions/${sessionId}/brief?force=true`, {});
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
        <Link href={insightsHref} className="text-label text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to insights
        </Link>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 max-w-3xl w-full mx-auto relative h-full">
      {/* Back link + header */}
      <div className="px-8 py-4 border-b border-border bg-muted/30 flex items-center gap-4">
        <Link
          href={insightsHref}
          className="flex items-center gap-1.5 text-label text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Insights
        </Link>
        <h1 className="text-h3 text-foreground">Creative Brief</h1>
        <div className="ml-auto flex items-center gap-2">
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

          <Popover>
            <PopoverTrigger 
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))} 
              aria-label="Actions" 
              disabled={!liveBrief}
            >
              <Settings2 className="w-4 h-4" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4 flex flex-col gap-3 border-border shadow-xl">
              <p className="text-label font-medium text-foreground">Generation Options</p>
              
              {models.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <p className="text-caption text-muted-foreground">Select model:</p>
                  <div className="flex gap-2 flex-wrap">
                    {models.map((model) => (
                      <button
                        key={model}
                        type="button"
                        id={`model-${model.toLowerCase().replace(/\s|\./g, "-")}-btn`}
                        onClick={() => setSelectedModel(model)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-label border transition-all text-left",
                          selectedModel === model
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        )}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-2">
                <Button
                  id="render-in-app-btn"
                  className="w-full"
                  disabled={(!selectedModel && models.length > 0) || briefStream.isStreaming}
                  onClick={() => toast.info("In-app rendering requires an account — coming soon.")}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Render in-app
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
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Brief text */}
      <div className="flex-1 overflow-y-auto p-8 pb-32">
        {isLoadingSkeleton ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-body text-foreground leading-relaxed font-sans">
            <ReactMarkdown>{liveBrief + (briefStream.isStreaming || isRefining ? " ▋" : "")}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Refinement input (Floating Pill) */}
      <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[calc(100%-2rem)] md:max-w-2xl bg-muted/90 backdrop-blur-xl border border-border/80 shadow-2xl rounded-full p-1.5 flex items-center gap-2 z-50 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
        {isRefining ? (
          <div className="pl-3 py-2 flex items-center justify-center shrink-0">
            <span className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full inline-block" />
          </div>
        ) : (
          <div className="flex items-center shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 ml-1"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload image"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {refinementImage && (
              <div className="relative ml-1 shrink-0">
                <img
                  src={`data:${refinementImage.mimeType};base64,${refinementImage.base64}`}
                  alt="Attachment"
                  className="h-8 w-8 rounded-md object-cover border border-border"
                />
                <button
                  onClick={() => setRefinementImage(null)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center shadow-sm hover:bg-destructive/90"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
        <input
          id="brief-refinement-input"
          type="text"
          value={refinement}
          onChange={(e) => setRefinement(e.target.value)}
          onKeyDown={handleRefinement}
          placeholder='Message AI to refine (e.g. "make it warmer")...'
          className="flex-1 bg-transparent text-body text-foreground placeholder:text-muted-foreground outline-none px-2 py-2.5"
          disabled={isRefining || briefStream.isStreaming}
        />
        <Button 
          type="button"
          size="icon"
          className="rounded-full shrink-0 h-9 w-9 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-30 disabled:bg-muted-foreground"
          onClick={submitRefinement}
          disabled={!refinement.trim() || isRefining || briefStream.isStreaming}
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        {refineStream.error && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max max-w-full px-4">
            <p className="text-caption text-destructive bg-destructive/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-destructive/20 shadow-sm truncate">
              {refineStream.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
