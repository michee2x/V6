"use client";

import * as React from "react";
import { InsightPanel } from "./insight-panel";
import { BriefPanel } from "./brief-panel";
import { useSSEStream } from "@/hooks/use-sse-stream";

type Phase = "basic" | "advanced" | "brief";

interface SessionWorkspaceProps {
  sessionId: string;
  initialUrl: string;
  contentType: string;
}

export function SessionWorkspace({ sessionId, initialUrl, contentType }: SessionWorkspaceProps) {
  const [phase, setPhase] = React.useState<Phase>("basic");

  // Three independent SSE streams — one per phase
  const basicStream = useSSEStream();
  const advancedStream = useSSEStream();
  const briefStream = useSSEStream();

  // Kick off the basic insight stream on mount
  React.useEffect(() => {
    basicStream.trigger(`/api/v1/sessions/${sessionId}/basic-insight`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleRequestAdvanced = React.useCallback(() => {
    setPhase("advanced");
    advancedStream.trigger(`/api/v1/sessions/${sessionId}/advanced-insight`, {});
  }, [sessionId, advancedStream]);

  // Auto-trigger advanced insight when basic is done
  React.useEffect(() => {
    if (
      basicStream.isDone &&
      !advancedStream.text &&
      !advancedStream.isStreaming &&
      !advancedStream.error
    ) {
      handleRequestAdvanced();
    }
  }, [basicStream.isDone, advancedStream.text, advancedStream.isStreaming, advancedStream.error, handleRequestAdvanced]);


  const handleRequestBrief = React.useCallback(() => {
    setPhase("brief");
    briefStream.trigger(`/api/v1/sessions/${sessionId}/brief`, {});
  }, [sessionId, briefStream]);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px]">
      {/* Left — Insight column */}
      <InsightPanel
        url={initialUrl}
        contentType={contentType}
        phase={phase}
        basicInsight={basicStream.text}
        advancedInsight={advancedStream.text}
        isStreamingBasic={basicStream.isStreaming}
        isStreamingAdvanced={advancedStream.isStreaming}
        basicError={basicStream.error}
        advancedError={advancedStream.error}
        onRetryBasic={() =>
          basicStream.trigger(`/api/v1/sessions/${sessionId}/basic-insight`)
        }
        onRequestAdvanced={handleRequestAdvanced}
        onRequestBrief={handleRequestBrief}
      />

      {/* Right — Brief column */}
      <BriefPanel
        sessionId={sessionId}
        phase={phase}
        brief={briefStream.text}
        isStreamingBrief={briefStream.isStreaming}
        briefError={briefStream.error}
        contentType={contentType}
        onBriefUpdate={(updated) => briefStream.reset()}
      />
    </div>
  );
}
