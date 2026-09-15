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
    }
  }, [isOpen]);

  // Load image and initialise canvas once modal is open
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

  const applyBrush = (
    ctx: CanvasRenderingContext2D,
    pos: Point,
    from: Point | null,
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

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => !isGenerating && onClose()}
      />

      {/*
        Modal shell
        ─ Mobile  : full screen, flex-col (image top, controls bottom)
        ─ Desktop : centered max-w-6xl, flex-row (image left, controls right)
      */}
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
        {/* ═══════════════════════════════════════════════════
            LEFT / TOP  —  Canvas + Image
            Image fills width at its natural aspect ratio.
            Canvas sits exactly on top as an absolute overlay.
        ═══════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-neutral-950 min-h-0">
          {base64Image && (
            <div className="relative w-full">
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
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            RIGHT (desktop) / BOTTOM (mobile)  —  Controls
            Mobile: compact sticky bar (brush + size + undo)
                    + prompt row below
            Desktop: full sidebar with all controls
        ═══════════════════════════════════════════════════ */}
        <div
          className="
            shrink-0 bg-background border-t border-border
            flex flex-col gap-3 px-3 py-3
            md:w-72 md:border-t-0 md:border-l md:gap-4 md:px-4 md:py-4
          "
        >
          {/* Header (desktop only) */}
          <div className="hidden md:flex items-start justify-between">
            <div>
              <p className="text-base font-semibold text-foreground">
                Edit Region
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Paint over the area you want to change, then describe what
                should go there.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="ml-2 shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile header row */}
          <div className="flex md:hidden items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Edit Region</p>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
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
              <Brush className="w-4 h-4" />
              Brush
            </button>
            <button
              onClick={() => setMode("eraser")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "eraser"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eraser className="w-4 h-4" />
              Eraser
            </button>
          </div>

          {/* Brush size */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-xs font-medium text-foreground">
                Brush Size
              </span>
              <span className="text-xs text-muted-foreground">
                {brushSize}px
              </span>
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
              <Undo2 className="w-4 h-4 mr-1.5" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9"
              onClick={handleClear}
              disabled={!hasStrokes}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Clear
            </Button>
          </div>

          {/* Divider */}
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
    </>,
    document.body,
  );
}
