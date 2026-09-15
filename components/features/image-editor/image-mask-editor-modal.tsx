"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Eraser,
  Brush,
  Undo2,
  RotateCcw,
  Wand2,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface ImageMaskEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  base64Image: string | null;
  mimeType?: string;
  sessionId?: string;
  onComplete?: (generatedImage: { base64: string; mimeType: string }) => void;
}

interface Point {
  x: number;
  y: number;
}

export function ImageMaskEditorModal({
  isOpen,
  onClose,
  base64Image,
  mimeType = "image/png",
  sessionId,
  onComplete,
}: ImageMaskEditorModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [brushSize, setBrushSize] = React.useState(30);
  const [mode, setMode] = React.useState<"brush" | "eraser">("brush");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasStrokes, setHasStrokes] = React.useState(false);
  const [history, setHistory] = React.useState<ImageData[]>([]);
  // Expanded = canvas fills the full screen, controls hidden
  const [isExpanded, setIsExpanded] = React.useState(false);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawingRef = React.useRef(false);
  const lastPosRef = React.useRef<Point | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPrompt("");
      setBrushSize(30);
      setMode("brush");
      setError(null);
      setHasStrokes(false);
      setHistory([]);
      setIsExpanded(false);
    }
  }, [isOpen]);

  // Load image into canvas on open
  React.useEffect(() => {
    if (!isOpen || !base64Image) return;
    const img = new Image();
    img.onload = () => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      cvs.width = img.naturalWidth;
      cvs.height = img.naturalHeight;
      const ctx = cvs.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        setHistory([ctx.getImageData(0, 0, cvs.width, cvs.height)]);
      }
    };
    img.src = `data:${mimeType};base64,${base64Image}`;
  }, [isOpen, base64Image, mimeType]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const cvs = canvasRef.current!;
    const rect = cvs.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (cvs.width / rect.width),
      y: (e.clientY - rect.top) * (cvs.height / rect.height),
    };
  };

  const applyBrush = (
    ctx: CanvasRenderingContext2D,
    pos: Point,
    from: Point | null
  ) => {
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (mode === "brush") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(255, 0, 102, 0.6)";
      ctx.fillStyle = "rgba(255, 0, 102, 0.6)";
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.fillStyle = "rgba(0,0,0,1)";
    }
    if (!from) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    lastPosRef.current = pos;
    applyBrush(ctx, pos, null);
    setHasStrokes(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPosRef.current) return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    applyBrush(ctx, pos, lastPosRef.current);
    lastPosRef.current = pos;
  };

  const onPointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (ctx) {
      setHistory((prev) => [
        ...prev,
        ctx.getImageData(0, 0, cvs.width, cvs.height),
      ]);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1 || !canvasRef.current) return;
    const next = history.slice(0, -1);
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.putImageData(next[next.length - 1], 0, 0);
      setHistory(next);
      setHasStrokes(next.length > 1);
    }
  };

  const handleClear = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      setHistory([ctx.getImageData(0, 0, cvs.width, cvs.height)]);
      setHasStrokes(false);
    }
  };

  const generateMaskBase64 = (): string | null => {
    const cvs = canvasRef.current;
    if (!cvs) return null;
    const off = document.createElement("canvas");
    off.width = cvs.width;
    off.height = cvs.height;
    const ctx = off.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, off.width, off.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(cvs, 0, 0);
    return off.toDataURL("image/png").split(",")[1];
  };

  const handleGenerate = async () => {
    if (!base64Image || !prompt.trim()) {
      setError("Please describe what you want the AI to generate.");
      return;
    }
    const maskBase64 = generateMaskBase64();
    if (!maskBase64) {
      setError("Failed to generate mask.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/generate/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          base64Image,
          base64Mask: maskBase64,
          prompt,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to generate image.");
      }
      if (onComplete) onComplete(data.data.images[0]);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!mounted || !isOpen) return null;

  // ─── Shared canvas section (used in both modes) ──────────────────────────────
  const canvasSection = (
    <div className={isExpanded ? "absolute inset-0" : "relative w-full"}>
      {base64Image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:${mimeType};base64,${base64Image}`}
            alt="Source"
            className="w-full h-auto block select-none pointer-events-none"
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute inset-0 w-full h-full touch-none"
            style={{ cursor: mode === "brush" ? "crosshair" : "cell" }}
          />
        </>
      )}
    </div>
  );

  // ─── Mini floating toolbar (expanded / fullscreen mode only) ─────────────────
  const expandedToolbar = (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl px-3 py-2">
      {/* Collapse */}
      <button
        onClick={() => setIsExpanded(false)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors pr-2 border-r border-border"
        aria-label="Collapse"
      >
        <Minimize2 className="w-4 h-4" />
        <span className="hidden sm:inline">Collapse</span>
      </button>

      {/* Brush / Eraser */}
      <div className="flex bg-muted rounded-lg p-0.5">
        <button
          onClick={() => setMode("brush")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "brush"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Brush className="w-3.5 h-3.5" /> Brush
        </button>
        <button
          onClick={() => setMode("eraser")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "eraser"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eraser className="w-3.5 h-3.5" /> Eraser
        </button>
      </div>

      {/* Size */}
      <div className="flex items-center gap-1.5 w-24 sm:w-36">
        <span className="text-xs text-muted-foreground shrink-0">{brushSize}px</span>
        <input
          type="range"
          min={5}
          max={150}
          step={1}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
      </div>

      {/* Undo */}
      <button
        onClick={handleUndo}
        disabled={history.length <= 1}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
        aria-label="Undo"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      {/* Clear */}
      <button
        onClick={handleClear}
        disabled={!hasStrokes}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
        aria-label="Clear"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => !isGenerating && !isExpanded && onClose()}
      />

      {/* ═══════════════════════════════════════════════════════════
          EXPANDED / FULLSCREEN MODE
          Canvas fills 100% of the screen. Floating mini toolbar at
          the bottom with brush controls only.
      ═══════════════════════════════════════════════════════════ */}
      {isExpanded && (
        <div className="fixed inset-0 z-[60] bg-neutral-950 overflow-y-auto overflow-x-hidden">
          {canvasSection}
          {expandedToolbar}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          NORMAL MODE
          Mobile: full screen flex-col
          Desktop: centered modal flex-row
      ═══════════════════════════════════════════════════════════ */}
      {!isExpanded && (
        <div
          className="
            fixed inset-0 z-50 flex flex-col overflow-hidden bg-background
            md:inset-auto md:left-1/2 md:top-1/2
            md:-translate-x-1/2 md:-translate-y-1/2
            md:w-[92vw] md:max-w-6xl md:h-[92vh]
            md:rounded-2xl md:shadow-2xl md:flex-row
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Image canvas (left on desktop, top on mobile) ── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-neutral-950 min-h-0 relative">
            {canvasSection}
          </div>

          {/* ── Controls (right sidebar on desktop, bottom strip on mobile) ── */}
          <div
            className="
              shrink-0 bg-background border-t border-border
              flex flex-col gap-3 px-3 py-3
              md:w-72 md:border-t-0 md:border-l md:gap-4 md:px-4 md:py-4
            "
          >
            {/* Header row — title + expand + close */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">Edit Region</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug hidden md:block">
                  Paint the area, then describe what should go there.
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Expand button */}
                <button
                  onClick={() => setIsExpanded(true)}
                  className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Expand to full screen"
                  title="Expand for easier selection"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                {/* Close button */}
                <button
                  onClick={onClose}
                  disabled={isGenerating}
                  className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Brush / Eraser toggle */}
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setMode("brush")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === "brush"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Brush className="w-4 h-4" /> Brush
              </button>
              <button
                onClick={() => setMode("eraser")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === "eraser"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eraser className="w-4 h-4" /> Eraser
              </button>
            </div>

            {/* Brush size */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-foreground">Brush Size</span>
                <span className="text-xs text-muted-foreground">{brushSize}px</span>
              </div>
              <input
                type="range"
                min={5}
                max={150}
                step={1}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-2 accent-primary rounded-full"
              />
            </div>

            {/* Undo + Clear */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={handleUndo}
                disabled={history.length <= 1}
              >
                <Undo2 className="w-4 h-4 mr-1.5" /> Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={handleClear}
                disabled={!hasStrokes}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Clear
              </Button>
            </div>

            <div className="border-t border-border" />

            {/* Prompt + Generate */}
            <div className="flex flex-col gap-2 md:flex-1">
              <label className="text-xs font-medium text-foreground">
                What should go here?
              </label>
              <Input
                placeholder='e.g. "A vibrant red cotton shirt"'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                disabled={isGenerating}
                className="h-10 text-sm"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full h-11 mt-1"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                {isGenerating ? "Generating…" : "Generate Edit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
