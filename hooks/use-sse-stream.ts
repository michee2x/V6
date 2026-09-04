"use client";

/**
 * hooks/use-sse-stream.ts
 *
 * Consumes a Server-Sent Events (SSE) endpoint and exposes streamed text.
 *
 * SSE format expected:
 *   data: {"type":"delta","text":"..."}  — incremental chunk
 *   data: {"type":"done","fullText":"..."} — stream complete
 *   data: {"type":"error","message":"..."} — stream error
 */

import * as React from "react";

interface UseSSEStreamResult {
  text: string;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
  /** Call to manually trigger the stream (for POST endpoints) */
  trigger: (url: string, body?: object) => void;
  reset: () => void;
}

export function useSSEStream(): UseSSEStreamResult {
  const [text, setText] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isDone, setIsDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const reset = React.useCallback(() => {
    abortRef.current?.abort();
    setText("");
    setIsStreaming(false);
    setIsDone(false);
    setError(null);
  }, []);

  const trigger = React.useCallback(
    async (url: string, body?: object) => {
      // Abort any previous stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setText("");
      setIsStreaming(true);
      setIsDone(false);
      setError(null);

      try {
        const res = await fetch(url, {
          method: body !== undefined ? "POST" : "GET",
          headers: body !== undefined ? { "Content-Type": "application/json" } : {},
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsStreaming(false);
            setIsDone(true);
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (delimited by \n\n)
          const messages = buffer.split("\n\n");
          buffer = messages.pop() ?? ""; // keep incomplete trailing chunk

          for (const message of messages) {
            const line = message.trim();
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice("data:".length).trim();
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "delta" && typeof event.text === "string") {
                setText((prev) => prev + event.text);
              } else if (event.type === "done") {
                setIsDone(true);
                setIsStreaming(false);
              } else if (event.type === "error") {
                setError(event.message ?? "Unknown stream error");
                setIsStreaming(false);
              }
            } catch {
              // Malformed SSE line — skip
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Stream failed");
        setIsStreaming(false);
      }
    },
    []
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { text, isStreaming, isDone, error, trigger, reset };
}
