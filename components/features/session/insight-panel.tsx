"use client";

import * as React from "react";
import { ChevronRight, Sparkles, Zap, RefreshCw, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface InsightPanelProps {
  url: string;
  contentType: string;
  phase: "basic" | "advanced" | "brief";
  basicInsight: string;
  advancedInsight: string;
  isStreamingBasic: boolean;
  isStreamingAdvanced: boolean;
  basicError: string | null;
  advancedError: string | null;
  onRetryBasic: () => void;
  onRequestAdvanced: () => void;
  onRequestBrief: () => void;
}

/** Blinking cursor shown while a stream is active */
function StreamCursor() {
  return (
    <span className="inline-block w-[2px] h-[1em] bg-foreground ml-0.5 align-middle animate-pulse" />
  );
}

/** Reusable error card with retry */
function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <p className="text-body">{message}</p>
      </div>
      <Button variant="outline" size="sm" className="self-start" onClick={onRetry}>
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
        Try again
      </Button>
    </div>
  );
}

export function InsightPanel({
  url,
  contentType,
  phase,
  basicInsight,
  advancedInsight,
  isStreamingBasic,
  isStreamingAdvanced,
  basicError,
  advancedError,
  onRetryBasic,
  onRequestAdvanced,
  onRequestBrief,
}: InsightPanelProps) {
  const [isLoadingAdvanced, setIsLoadingAdvanced] = React.useState(false);
  const [isLoadingBrief, setIsLoadingBrief] = React.useState(false);

  const handleAdvanced = () => {
    setIsLoadingAdvanced(true);
    onRequestAdvanced();
  };

  const handleBrief = () => {
    setIsLoadingBrief(true);
    onRequestBrief();
  };

  // Reset local loading flags once streams are active or done
  React.useEffect(() => {
    if (isStreamingAdvanced || advancedInsight) setIsLoadingAdvanced(false);
  }, [isStreamingAdvanced, advancedInsight]);

  React.useEffect(() => {
    if (phase === "brief") setIsLoadingBrief(false);
  }, [phase]);

  const isLoadingBasicSkeleton = isStreamingBasic && basicInsight.length === 0;
  const isLoadingAdvancedSkeleton =
    (isStreamingAdvanced || isLoadingAdvanced) && advancedInsight.length === 0;

  return (
    <div className="flex flex-col gap-0 border-r border-border overflow-y-auto">
      {/* Source strip */}
      <div className="px-8 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
        <span className="text-caption text-muted-foreground truncate max-w-xs">
          {url || "Uploaded file"}
        </span>
        <span className="ml-auto shrink-0 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-caption text-muted-foreground capitalize">
          {contentType === "auto" ? "Detecting..." : contentType}
        </span>
      </div>

      <div className="flex flex-col gap-8 p-8">
        {/* Phase 1 — Basic Insight */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-label text-muted-foreground uppercase tracking-wide">
              Basic Insight
            </h2>
          </div>

          {basicError ? (
            <ErrorCard
              message={basicError}
              onRetry={onRetryBasic}
            />
          ) : isLoadingBasicSkeleton ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-body-lg text-foreground leading-relaxed">
              <ReactMarkdown>{basicInsight + (isStreamingBasic ? " ▋" : "")}</ReactMarkdown>
            </div>
          )}
        </section>

        {/* Phase 1.5 — Advanced Insights (Hidden by default) */}
        {(advancedInsight || isStreamingAdvanced || advancedError || isLoadingAdvanced) && (
          <details className="group border border-border rounded-lg overflow-hidden">
            <summary className="flex items-center gap-2 p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-label text-foreground uppercase tracking-wide">
                Advanced Insights
              </h2>
              <div className="ml-auto flex items-center gap-2">
                {isStreamingAdvanced && (
                  <span className="text-caption text-muted-foreground animate-pulse">
                    Analysing...
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
              </div>
            </summary>

            <div className="p-6 border-t border-border bg-background/50">
              {advancedError ? (
                <ErrorCard
                  message={advancedError}
                  onRetry={() => {
                    onRequestAdvanced();
                  }}
                />
              ) : isLoadingAdvancedSkeleton ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className={cn(
                  "prose prose-sm dark:prose-invert max-w-none text-body text-foreground leading-relaxed",
                  phase === "brief" && "opacity-80"
                )}>
                  <ReactMarkdown>{advancedInsight + (isStreamingAdvanced ? " ▋" : "")}</ReactMarkdown>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons — available after Basic Insight is done */}
        {!isStreamingBasic && basicInsight && !basicError && phase !== "brief" && (
          <div className="pt-2">
            <Button
              id="create-brief-btn"
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleBrief}
              disabled={isLoadingBrief}
            >
              {isLoadingBrief ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
                  Building brief...
                </>
              ) : (
                <>
                  Create creative brief
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
