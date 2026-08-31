"use client";

import * as React from "react";
import { ChevronRight, Sparkles, Zap, RefreshCw, AlertCircle, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface InsightPanelProps {
  basicInsight: string;
  advancedInsight: string;
  isStreamingBasic: boolean;
  isStreamingAdvanced: boolean;
  basicError: string | null;
  advancedError: string | null;
  onRetryBasic: () => void;
  onRequestAdvanced: () => void;
  onCreateBrief: () => void;
}

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
  basicInsight,
  advancedInsight,
  isStreamingBasic,
  isStreamingAdvanced,
  basicError,
  advancedError,
  onRetryBasic,
  onRequestAdvanced,
  onCreateBrief,
}: InsightPanelProps) {
  const [isLoadingAdvanced, setIsLoadingAdvanced] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleAdvanced = () => {
    setIsLoadingAdvanced(true);
    onRequestAdvanced();
  };

  const handleCreateBrief = () => {
    setIsNavigating(true);
    onCreateBrief();
  };

  React.useEffect(() => {
    if (isStreamingAdvanced || advancedInsight) setIsLoadingAdvanced(false);
  }, [isStreamingAdvanced, advancedInsight]);

  const isLoadingBasicSkeleton    = isStreamingBasic    && basicInsight.length    === 0;
  const isLoadingAdvancedSkeleton = (isStreamingAdvanced || isLoadingAdvanced) && advancedInsight.length === 0;

  return (
    <div className="flex flex-col gap-0 overflow-y-auto flex-1">

      <div className="flex flex-col gap-8 p-8 max-w-3xl w-full mx-auto">
        {/* Phase 1 — Basic Insight */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-label text-muted-foreground uppercase tracking-wide">Basic Insight</h2>
          </div>

          {basicError ? (
            <ErrorCard message={basicError} onRetry={onRetryBasic} />
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

        {/* Phase 1.5 — Advanced Insights */}
        {(advancedInsight || isStreamingAdvanced || advancedError || isLoadingAdvanced) && (
          <details className="group border border-border rounded-lg overflow-hidden">
            <summary className="flex items-center gap-2 p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-label text-foreground uppercase tracking-wide">Advanced Insights</h2>
              <div className="ml-auto flex items-center gap-2">
                {isStreamingAdvanced && (
                  <span className="text-caption text-muted-foreground animate-pulse">Analysing...</span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
              </div>
            </summary>

            <div className="p-6 border-t border-border bg-background/50">
              {advancedError ? (
                <ErrorCard message={advancedError} onRetry={onRequestAdvanced} />
              ) : isLoadingAdvancedSkeleton ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-body text-foreground leading-relaxed">
                  <ReactMarkdown>{advancedInsight + (isStreamingAdvanced ? " ▋" : "")}</ReactMarkdown>
                </div>
              )}
            </div>
          </details>
        )}

        {/* CTA — Create Creative Brief (navigates to /session/[id]/brief) */}
        {!isStreamingBasic && basicInsight && !basicError && (
          <div className="pt-2">
            <Button
              id="create-brief-btn"
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleCreateBrief}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
                  Opening brief...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
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
