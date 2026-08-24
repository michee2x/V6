"use client";

import * as React from "react";
import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Special token that the AI emits when it wants to ask a question
const QUESTION_TOKEN_REGEX = /\[\[QUESTION:\s*(\{.*?\})\s*\]\]/;

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatThreadProps {
  messages: Message[];
  onSelectOption: (option: string) => void;
  isStreaming?: boolean;
}

export function ChatThread({ messages, onSelectOption, isStreaming }: ChatThreadProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  if (messages.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="max-h-[50vh] overflow-y-auto w-full px-4 pt-4 pb-16 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {messages.map((msg, index) => {
        const isUser = msg.role === "user";
        
        // Parse for question cards if assistant
        let textContent = msg.content;
        let questionData = null;
        
        if (!isUser) {
          const match = msg.content.match(QUESTION_TOKEN_REGEX);
          if (match) {
            try {
              questionData = JSON.parse(match[1]);
              textContent = msg.content.replace(QUESTION_TOKEN_REGEX, "").trim();
            } catch (e) {
              console.error("Failed to parse question card", e);
            }
          }
        }

        const isLastAndStreaming = isStreaming && index === messages.length - 1 && !isUser;

        return (
          <div key={msg.id} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
            <div className={cn("flex gap-3 max-w-[85%]", isUser ? "flex-row-reverse" : "flex-row")}>
              
              {/* Avatar */}
              <div className="shrink-0 mt-1">
                {isUser ? (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    <User className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-foreground">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex flex-col gap-2 min-w-0">
                {textContent && (
                  <div 
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-body",
                      isUser 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted border border-border text-foreground rounded-tl-sm"
                    )}
                  >
                    {textContent}
                    {isLastAndStreaming && <span className="animate-pulse ml-1">▋</span>}
                  </div>
                )}

                {/* AI Question Card */}
                {questionData && (
                  <div className="bg-background border border-border rounded-xl shadow-sm p-4 flex flex-col gap-3 mt-1 animate-in zoom-in-95 duration-200">
                    <p className="text-label font-medium text-foreground">{questionData.title || "Question"}</p>
                    {questionData.description && (
                      <p className="text-body text-muted-foreground">{questionData.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(questionData.options || []).map((opt: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => onSelectOption(opt)}
                          className="px-3 py-1.5 rounded-full border border-border bg-muted/30 text-body text-foreground hover:bg-muted hover:border-foreground/30 transition-colors text-left"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
