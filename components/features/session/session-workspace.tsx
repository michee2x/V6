"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InsightPanel } from "./insight-panel";
import { useSSEStream } from "@/hooks/use-sse-stream";

interface SessionWorkspaceProps {
  sessionId: string;
  initialUrl: string;
  contentType: string;
}

export function SessionWorkspace({ sessionId, initialUrl, contentType }: SessionWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const basicStream    = useSSEStream();
  const advancedStream = useSSEStream();

  // Kick off the basic insight stream on mount
  React.useEffect(() => {
    basicStream.trigger(`/api/v1/sessions/${sessionId}/basic-insight`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleRequestAdvanced = React.useCallback(() => {
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

  const handleCreateBrief = React.useCallback(() => {
    // Navigate to the brief page — it lives at /session/[id]/brief
    const params = searchParams.toString() ? `?${searchParams.toString()}` : "";
    router.push(`/session/${sessionId}/brief${params}`);
  }, [sessionId, router, searchParams]);

  return (
    <div className="flex-1 flex flex-col">
      <InsightPanel
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
        onCreateBrief={handleCreateBrief}
      />
    </div>
  );
}
