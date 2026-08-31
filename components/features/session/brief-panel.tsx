"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Copy, Download, Wand2, CheckCheck, AlertCircle, RefreshCw, ArrowLeft, Settings2, ArrowUp, Paperclip, X, Loader2, Image as ImageIcon, Video, FileText, Undo2, Redo2, ChevronDown, ChevronUp, MessageSquare, Lock, Sparkles, LogIn, Check
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { ChatThread, Message } from "./chat-thread";
import { OutOfCreditsModal } from "@/components/modals/out-of-credits-modal";

interface BriefPanelProps {
  sessionId: string;
  contentType: string;
  isLoggedIn: boolean;
  userPlan: string; // "free" | "starter" | "growth" | "pro"
}

/** Returns true if this plan can generate video */
function canGenerateVideo(plan: string) {
  return plan !== "free";
}

/** Returns true if this plan can use max (high) quality images */
function canUseHighQuality(plan: string) {
  return plan !== "free";
}

/** Returns true if this user is on a paid plan at all */
function isPaidPlan(plan: string) {
  return plan !== "free";
}

// Content-type label for UX copy
const contentTypeLabel: Record<string, string> = {
  image:   "image",
  video:   "video",
  article: "document",
  auto:    "image",
};

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
type ImageQuality = "low" | "medium" | "high";

type GenerationResult =
  | { type: "image"; images: { base64: string; mimeType: string }[] }
  | { type: "video"; video: { url?: string; base64?: string; mimeType?: string } }
  | { type: "document"; document: string };

export function BriefPanel({ sessionId, contentType, isLoggedIn, userPlan }: BriefPanelProps) {
  const searchParams = useSearchParams();
  const briefStream  = useSSEStream();
  const refineStream = useSSEStream();

  const [copied, setCopied] = React.useState(false);
  const [refinement, setRefinement] = React.useState("");
  const [refinementImage, setRefinementImage] = React.useState<{ mimeType: string; base64: string } | null>(null);
  const [hastriggered, setHasTriggered] = React.useState(false);
  const [isRendering, setIsRendering] = React.useState(false);
  const [generationResult, setGenerationResult] = React.useState<GenerationResult | null>(null);
  const [showOutOfCredits, setShowOutOfCredits] = React.useState(false);
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("1:1");
  const [imageQuality, setImageQuality] = React.useState<ImageQuality>("medium");
  const [showMoreAspect, setShowMoreAspect] = React.useState(false);
  
  const [chatMessages, setChatMessages] = React.useState<Message[]>([]);
  const [history, setHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [changedParagraphs, setChangedParagraphs] = React.useState<Set<number>>(new Set());
  const [isChatCollapsed, setIsChatCollapsed] = React.useState(false);
  const [showJsonView, setShowJsonView] = React.useState(false);

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
      const base64Data = base64Url.split(",")[1];
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

  // Undo/Redo keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          setHistoryIndex(prev => Math.max(0, prev - 1));
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history.length]);

  // Initial Master Prompt load -> history
  React.useEffect(() => {
    if (briefStream.isDone && briefStream.text && history.length === 0) {
      setHistory([briefStream.text]);
      setHistoryIndex(0);
      setChatMessages([{
        id: "init", role: "assistant", content: "Your Master Prompt is ready. Refine it by telling me your subject, colours, style changes, or anything else."
      }]);
    }
  }, [briefStream.isDone, briefStream.text, history.length]);

  // Refine stream done -> diff & history
  React.useEffect(() => {
    if (refineStream.isDone && refineStream.text) {
      const newText = refineStream.text;
      
      setHistory(prev => {
        const currentText = prev[historyIndex] || "";
        const oldLines = currentText.split("\n\n");
        const newLines = newText.split("\n\n");
        const changed = new Set<number>();
        newLines.forEach((line, i) => {
          if (line !== oldLines[i]) changed.add(i);
        });
        setChangedParagraphs(changed);
        setTimeout(() => setChangedParagraphs(new Set()), 3000);

        const newStack = prev.slice(0, historyIndex + 1);
        newStack.push(newText);
        if (newStack.length > 20) newStack.shift();
        setHistoryIndex(newStack.length - 1);
        return newStack;
      });

      const match = newText.match(/\[\[QUESTION:\s*(\{.*?\})\s*\]\]/);
      const aiReply = match ? match[0] : "Master Prompt updated. What else would you like to change?";

      setChatMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: aiReply }
      ]);
    }
  }, [refineStream.isDone, refineStream.text]);

  let rawBrief = "";
  if (historyIndex >= 0 && historyIndex < history.length) {
    rawBrief = history[historyIndex];
  } else if (briefStream.text) {
    rawBrief = briefStream.text;
  }
  if (refineStream.isStreaming) {
    rawBrief = refineStream.text;
  }

  const liveBrief = rawBrief.replace(/\[\[QUESTION:\s*(\{.*?\})\s*\]\]/g, "").trim();
  const isRefining = refineStream.isStreaming;

  // Access control derived state
  const effectiveType = contentType === "auto" ? "image" : contentType;
  const isVideoContent = effectiveType === "video";
  const isVideoBocked  = isVideoContent && !canGenerateVideo(userPlan);

  // Insights back link — preserve search params
  const params       = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const insightsHref = `/session/${sessionId}${params}`;

  /** Copy the final_prompt (for JSON) or full text to clipboard */
  const handleCopy = async () => {
    if (!liveBrief) return;
    let textToCopy = liveBrief;
    try {
      const parsed = JSON.parse(liveBrief);
      if (parsed.final_prompt) textToCopy = parsed.final_prompt;
    } catch { /* not JSON — use raw */ }
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Final prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  /** Export helpers */
  const exportAsJson = () => {
    const blob = new Blob([liveBrief], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "master-prompt.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  };

  const exportAsText = () => {
    let text = "";
    try {
      const p = JSON.parse(liveBrief);
      text = p.final_prompt ?? liveBrief;
    } catch { text = liveBrief; }
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "master-prompt.txt"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as plain text");
  };

  const submitRefinement = (customInstruction?: string) => {
    const instruction = typeof customInstruction === 'string' ? customInstruction.trim() : refinement.trim();
    if (!instruction || isRefining) return;
    
    setRefinement("");
    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: instruction }]);
    
    refineStream.reset();
    refineStream.trigger(`/api/v1/sessions/${sessionId}/refine`, {
      brief: rawBrief,
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

  const handleRenderInApp = async () => {
    if (!liveBrief || isRendering) return;

    setIsRendering(true);
    setGenerationResult(null);

    try {
      let endpoint = "/api/v1/generate/image";
      if (effectiveType === "video") endpoint = "/api/v1/generate/video";
      if (effectiveType === "article") endpoint = "/api/v1/generate/document";

      const bodyPayload: Record<string, any> = { sessionId };
      if (effectiveType === "image") {
        bodyPayload.aspectRatio = aspectRatio;
        bodyPayload.quality = imageQuality;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Generation failed.");
      }

      // Navigate to the output tab
      const queryParams = searchParams.toString() ? `?${searchParams.toString()}` : "";
      window.location.href = `/session/${sessionId}/output${queryParams}`;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed.";
      // Check if this is an insufficient credits error
      if (message.toLowerCase().includes("insufficient credits") || message.toLowerCase().includes("insufficient")) {
        setShowOutOfCredits(true);
      } else {
        toast.error(message);
      }
    } finally {
      setIsRendering(false);
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
    <div className="flex flex-col flex-1 w-full mx-auto relative h-full">
      {/* Out-of-credits modal */}
      <OutOfCreditsModal
        open={showOutOfCredits}
        onClose={() => setShowOutOfCredits(false)}
      />
      {/* Back link + header */}
      <div className="px-4 md:px-8 py-3 md:py-4 border-b border-border bg-muted/30 flex items-center justify-between gap-2 md:gap-4 shrink-0">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <Link
            href={insightsHref}
            className="flex items-center gap-1.5 text-label text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Analysis</span>
          </Link>
          <h1 className="text-h4 md:text-h3 text-foreground truncate hidden xs:block">Master Prompt</h1>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHistoryIndex(i => Math.max(0, i - 1))}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="h-8 w-8 p-0"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHistoryIndex(i => Math.min(history.length - 1, i + 1))}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
              className="h-8 w-8 p-0"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
          </div>
          
          <Button
            id="copy-brief-btn"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            aria-label="Copy brief"
            disabled={!liveBrief}
            className="h-8 w-8 p-0 hidden sm:flex"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>

          {/* Primary Action Button (Pulled out of popover for visibility) */}
          {isLoggedIn && !isVideoBocked && (
            <Button
              id="recreate-now-btn-header"
              size="sm"
              className="h-8 font-semibold tracking-wide shadow-sm"
              disabled={!liveBrief || isRendering}
              onClick={handleRenderInApp}
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Recrea8</span>
                  <span className="sm:hidden ml-1.5">Recrea8</span>
                </>
              )}
            </Button>
          )}

          <Popover>
            <PopoverTrigger
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-2")}
              aria-label="Settings"
              disabled={!liveBrief}
            >
              <Settings2 className="w-4 h-4" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-h-[80vh] overflow-y-auto p-4 flex flex-col gap-3 border-border shadow-xl">
              <p className="text-label font-medium text-foreground">Generation Options</p>

              {/* Access-control CTA */}
              <div className="flex flex-col gap-2 mt-1">
                {!isLoggedIn ? (
                  /* ── Logged-out: must sign in to generate ── */
                  <>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                      <LogIn className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <p className="text-caption text-muted-foreground leading-snug">
                        Sign in to unlock generation. Analysis is always free.
                      </p>
                    </div>
                    <Link
                      id="sign-in-to-recreate-btn"
                      href="/login"
                      className={cn(buttonVariants({ variant: "default" }), "w-full")}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign in to Recrea8
                    </Link>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Export Master Prompt</p>
                      <Button id="export-json-btn" variant="outline" className="w-full justify-start" disabled={!liveBrief} onClick={exportAsJson}>
                        <Download className="w-4 h-4 mr-2" />Export as JSON
                      </Button>
                      <Button id="export-text-btn" variant="outline" className="w-full justify-start" disabled={!liveBrief} onClick={exportAsText}>
                        <FileText className="w-4 h-4 mr-2" />Export plain text
                      </Button>
                    </div>
                  </>
                ) : isVideoBocked ? (
                  /* ── Free user trying video ── */
                  <>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25">
                      <Lock className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                      <p className="text-caption text-amber-600 dark:text-amber-400 leading-snug">
                        Video generation is available on paid plans. Upgrade to start creating videos.
                      </p>
                    </div>
                    <Link
                      id="upgrade-for-video-btn"
                      href={`/#pricing?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "")}`}
                      className={cn(buttonVariants({ variant: "default" }), "w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500")}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade to unlock video
                    </Link>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Export Master Prompt</p>
                      <Button id="export-json-btn-video" variant="outline" className="w-full justify-start" disabled={!liveBrief} onClick={exportAsJson}>
                        <Download className="w-4 h-4 mr-2" />Export as JSON
                      </Button>
                      <Button id="export-text-btn-video" variant="outline" className="w-full justify-start" disabled={!liveBrief} onClick={exportAsText}>
                        <FileText className="w-4 h-4 mr-2" />Export plain text
                      </Button>
                    </div>
                  </>
                ) : (
                  /* ── Logged-in with access ── */
                  <>
                    {/* Image-specific settings */}
                    {effectiveType === "image" && (
                      <div className="flex flex-col gap-3">
                        {/* Aspect Ratio */}
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Aspect Ratio</p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {([
                              { ratio: "1:1" as AspectRatio, label: "Square", w: 28, h: 28 },
                              { ratio: "16:9" as AspectRatio, label: "Landscape", w: 36, h: 20 },
                              { ratio: "9:16" as AspectRatio, label: "Portrait", w: 20, h: 36 },
                              { ratio: "4:3" as AspectRatio, label: "4:3", w: 32, h: 24 },
                            ]).map(({ ratio, label, w, h }) => (
                              <button
                                key={ratio}
                                onClick={() => setAspectRatio(ratio)}
                                className={cn(
                                  "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border transition-all duration-150 hover:border-primary/60",
                                  aspectRatio === ratio
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-muted/40 text-muted-foreground"
                                )}
                              >
                                <span
                                  className={cn(
                                    "rounded-sm border-2 transition-colors",
                                    aspectRatio === ratio ? "border-primary" : "border-muted-foreground/50"
                                  )}
                                  style={{ width: w / 2.5, height: h / 2.5, display: "block" }}
                                />
                                <span className="text-[9px] sm:text-[10px] font-medium leading-none truncate w-full text-center">{label}</span>
                              </button>
                            ))}
                          </div>
                          {/* 3:4 toggle */}
                          <button
                            onClick={() => setAspectRatio("3:4")}
                            className={cn(
                              "mt-1.5 w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all",
                              aspectRatio === "3:4"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            <span>Tall Portrait (3:4)</span>
                            {aspectRatio === "3:4" && <Check className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Quality */}
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quality</p>
                          <div className="flex gap-1.5">
                            {([
                              { value: "low" as ImageQuality, label: "Low", requiresPaid: false },
                              { value: "medium" as ImageQuality, label: "Medium", requiresPaid: false },
                              { value: "high" as ImageQuality, label: "High", requiresPaid: true },
                            ]).map(({ value, label, requiresPaid }) => {
                              const locked = requiresPaid && !canUseHighQuality(userPlan);
                              return (
                                <button
                                  key={value}
                                  disabled={locked}
                                  title={locked ? "Requires Starter plan or above" : undefined}
                                  onClick={() => !locked && setImageQuality(value)}
                                  className={cn(
                                    "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                                    locked
                                      ? "border-border text-muted-foreground/40 cursor-not-allowed opacity-60"
                                      : imageQuality === value
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border text-muted-foreground hover:border-primary/40"
                                  )}
                                >
                                  {locked && <Lock className="w-3 h-3" />}
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                          {!canUseHighQuality(userPlan) && (
                            <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
                              High quality requires{" "}
                              <Link href="/#pricing" className="text-primary underline underline-offset-2">Starter+</Link>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Export Master Prompt</p>
                      <Button id="export-json-btn-main" variant="outline" className="w-full justify-start" disabled={!liveBrief} onClick={exportAsJson}>
                        <Download className="w-4 h-4 mr-2" />Export as JSON
                      </Button>
                      <Button id="export-text-btn-main" variant="outline" className="w-full justify-start" disabled={!liveBrief} onClick={exportAsText}>
                        <FileText className="w-4 h-4 mr-2" />Export plain text
                      </Button>
                      <Button
                        id="copy-prompt-mobile-btn"
                        variant="outline"
                        className="w-full sm:hidden justify-start"
                        disabled={!liveBrief}
                        onClick={handleCopy}
                      >
                        {copied ? <CheckCheck className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copied" : "Copy final prompt"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 max-w-3xl w-full mx-auto">
        {isLoadingSkeleton ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (() => {
          // Try to parse as JSON Master Prompt
          let parsed: Record<string, string> | null = null;
          const isStreaming = briefStream.isStreaming || isRefining;
          try {
            if (!isStreaming) parsed = JSON.parse(liveBrief);
          } catch { /* still streaming or plain text */ }

          if (parsed) {
            // ── JSON Master Prompt: pretty card view ─────────────────────
            const fieldLabels: Record<string, string> = {
              subject: "Subject", style: "Style", composition: "Composition",
              lighting: "Lighting", color_palette: "Colour Palette", mood: "Mood",
              technical: "Technical", negative_prompt: "Negative Prompt", final_prompt: "Final Prompt",
              // Video
              format: "Format", hook: "Hook", structure: "Structure",
              visual_style: "Visual Style", audio: "Audio", tone: "Tone",
              // Article
              topic: "Topic", rhetorical_techniques: "Rhetorical Techniques",
              target_audience: "Target Audience",
            };
            const fieldColors: Record<string, string> = {
              final_prompt: "border-primary/40 bg-primary/5",
              negative_prompt: "border-destructive/30 bg-destructive/5",
            };
            return (
              <div className="flex flex-col gap-2">
                {/* View toggle */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Master Prompt</p>
                  <button
                    onClick={() => setShowJsonView(v => !v)}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border bg-muted/30 hover:bg-muted/60"
                  >
                    {showJsonView ? "Card view" : "JSON view"}
                  </button>
                </div>

                {showJsonView ? (
                  // Raw JSON view
                  <pre className="text-[11px] font-mono bg-muted/30 border border-border rounded-xl p-4 overflow-x-auto leading-relaxed text-foreground whitespace-pre-wrap break-words">
                    {JSON.stringify(parsed, null, 2)}
                  </pre>
                ) : (
                  // Card view
                  Object.entries(parsed).map(([key, value]) => (
                    <div
                      key={key}
                      className={cn(
                        "rounded-xl border p-4 flex flex-col gap-1.5 transition-colors duration-700",
                        fieldColors[key] ?? "border-border bg-card",
                        changedParagraphs.size > 0 && "bg-amber-50/60 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700"
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {fieldLabels[key] ?? key.replace(/_/g, " ")}
                      </p>
                      <p className={cn(
                        "text-body text-foreground leading-relaxed",
                        key === "final_prompt" && "font-medium",
                        key === "negative_prompt" && "text-muted-foreground",
                      )}>
                        {String(value)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            );
          }

          // ── Plain text / streaming fallback ────────────────────────────
          return (
            <div className="prose prose-sm dark:prose-invert max-w-none text-body text-foreground leading-relaxed font-sans flex flex-col gap-4">
              {liveBrief.split("\n\n").map((para, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "transition-colors duration-1000 p-2 -mx-2 rounded-md border-l-2 border-transparent",
                    changedParagraphs.has(idx) && "bg-amber-50 border-amber-300 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:border-amber-700"
                  )}
                >
                  <ReactMarkdown>{para + (idx === liveBrief.split("\n\n").length - 1 && (briefStream.isStreaming || isRefining) ? " ▋" : "")}</ReactMarkdown>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Generation Result Overlay */}
      {generationResult && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                {generationResult.type === "image" && <ImageIcon className="w-4 h-4 text-primary" />}
                {generationResult.type === "video" && <Video className="w-4 h-4 text-primary" />}
                {generationResult.type === "document" && <FileText className="w-4 h-4 text-primary" />}
                <p className="text-label font-medium text-foreground capitalize">
                  Generated {generationResult.type}
                </p>
              </div>
              <button
                onClick={() => setGenerationResult(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {generationResult.type === "image" && (() => {
                // Free users may download only their own low-quality results
                const canDownload = isPaidPlan(userPlan) || imageQuality === "low";
                return (
                  <div className="flex flex-col gap-4">
                    {generationResult.images.map((img, i) => (
                      <img
                        key={i}
                        src={`data:${img.mimeType};base64,${img.base64}`}
                        alt={`Generated image ${i + 1}`}
                        className="w-full rounded-xl border border-border object-contain select-none"
                        onContextMenu={!canDownload ? (e) => e.preventDefault() : undefined}
                        draggable={canDownload}
                      />
                    ))}
                    {canDownload ? (
                      <a
                        href={`data:${generationResult.images[0].mimeType};base64,${generationResult.images[0].base64}`}
                        download="generated-image.png"
                        className={cn(buttonVariants({ variant: "outline" }), "w-full mt-2")}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download image
                      </a>
                    ) : (
                      <div className="mt-2 text-center text-xs text-muted-foreground bg-muted/30 py-2 rounded-md border border-border">
                        <p>Downloading high-quality images requires a paid plan.</p>
                        <Link href="/#pricing" className="text-primary hover:underline ml-1">Upgrade now</Link>
                      </div>
                    )}
                  </div>
                );
              })()}
              {generationResult.type === "video" && (
                <div className="flex flex-col gap-4">
                  {generationResult.video.url ? (
                    <video
                      src={generationResult.video.url}
                      controls
                      className="w-full rounded-xl border border-border"
                    />
                  ) : generationResult.video.base64 ? (
                    <video
                      src={`data:${generationResult.video.mimeType ?? "video/mp4"};base64,${generationResult.video.base64}`}
                      controls
                      className="w-full rounded-xl border border-border"
                    />
                  ) : (
                    <p className="text-body text-muted-foreground">Video generated. Check the server response.</p>
                  )}
                </div>
              )}
              {generationResult.type === "document" && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-body text-foreground leading-relaxed font-sans">
                  <ReactMarkdown>{generationResult.document}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refinement input (Collapsible Chat) */}
      <div className={cn(
        "fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[calc(100%-2rem)] md:max-w-2xl bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-40 transition-all duration-300",
        isChatCollapsed && "shadow-lg"
      )}>
        {/* Chat header toggle bar */}
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 cursor-pointer select-none group transition-colors",
            isChatCollapsed
              ? "bg-primary/10 hover:bg-primary/15 border-b-0"
              : "bg-muted/40 hover:bg-muted/60 border-b border-border"
          )}
          onClick={() => setIsChatCollapsed(prev => !prev)}
          role="button"
          aria-expanded={!isChatCollapsed}
          aria-label={isChatCollapsed ? "Expand chat" : "Collapse chat"}
          id="chat-toggle-btn"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className={cn(
              "w-3.5 h-3.5 transition-colors",
              isChatCollapsed ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-label font-medium transition-colors",
              isChatCollapsed ? "text-primary" : "text-muted-foreground"
            )}>
              Chat
            </span>
            {chatMessages.length > 0 && (
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none transition-colors",
                isChatCollapsed
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {chatMessages.length}
              </span>
            )}
            {isChatCollapsed && (
              <span className="text-[10px] text-primary/70 font-normal ml-0.5">
                · click to expand
              </span>
            )}
          </div>
          <div className={cn(
            "flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors",
            isChatCollapsed && "text-primary group-hover:text-primary"
          )}>
            {isChatCollapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Collapsible body */}
        {!isChatCollapsed && (
          <>
            <ChatThread
              messages={chatMessages}
              onSelectOption={submitRefinement}
              isStreaming={isRefining}
            />

            <div className="p-1.5 flex items-center gap-2 focus-within:bg-muted/30 transition-colors bg-muted/50">
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
                onClick={() => submitRefinement()}
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
          </>
        )}
      </div>
    </div>
  );
}
