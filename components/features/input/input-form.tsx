"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Link2, Upload, FileImage, Video, Newspaper, X, ZoomIn,
  FileText, File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ContentType = "auto" | "video" | "image" | "article";

const contentTypes: { value: ContentType; label: string; icon: React.ElementType }[] = [
  { value: "auto",    label: "Auto",    icon: Link2 },
  { value: "video",   label: "Video",   icon: Video },
  { value: "image",   label: "Image",   icon: FileImage },
  { value: "article", label: "Article", icon: Newspaper },
];

/** Returns the category of an uploaded File */
function fileCategory(file: File): "image" | "video" | "other" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "other";
}

/** Upper-case extension badge, e.g. "PDF", "DOCX", "TXT" */
function fileExtBadge(file: File): string {
  const ext = file.name.split(".").pop() ?? "";
  return ext.toUpperCase().slice(0, 4);
}

export function InputForm() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [contentType, setContentType] = React.useState<ContentType>("auto");
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasInput = url.trim().length > 0 || uploadedFile !== null;
  const category = uploadedFile ? fileCategory(uploadedFile) : null;

  // Generate object URL for image/video preview
  React.useEffect(() => {
    if (uploadedFile && (category === "image" || category === "video")) {
      const objUrl = URL.createObjectURL(uploadedFile);
      setPreviewUrl(objUrl);
      return () => URL.revokeObjectURL(objUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadedFile, category]);

  // Close lightbox on Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsLightboxOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasInput || isLoading) return;
    setIsLoading(true);

    try {
      let res: Response;

      if (uploadedFile) {
        const form = new FormData();
        form.append("file", uploadedFile);
        form.append("contentType", contentType);
        res = await fetch("/api/v1/sessions", { method: "POST", body: form });
      } else {
        res = await fetch("/api/v1/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim(), contentType }),
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data?.error?.message ?? "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      const { sessionId, contentType: resolvedType, url: sessionUrl } = data.data;
      router.push(
        `/session/${sessionId}?url=${encodeURIComponent(sessionUrl)}&type=${resolvedType}`
      );
    } catch {
      toast.error("Could not reach the server. Check your connection.");
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setUploadedFile(file); setUrl(""); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setUploadedFile(file); setUrl(""); }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Content type selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit self-center">
          {contentTypes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setContentType(value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label transition-all duration-150",
                contentType === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Main input area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all duration-150",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-background hover:border-muted-foreground/30"
          )}
        >
          {uploadedFile ? (
            <div className="flex items-center gap-3 p-3">
              {/* ── Image thumbnail ── */}
              {category === "image" && previewUrl && (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative group shrink-0 rounded-md overflow-hidden border border-border w-12 h-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Preview image"
                  title="Click to preview"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </span>
                </button>
              )}

              {/* ── Video first-frame preview ── */}
              {category === "video" && previewUrl && (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative group shrink-0 rounded-md overflow-hidden border border-border w-12 h-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-black"
                  aria-label="Preview video"
                  title="Click to preview"
                >
                  <video
                    src={previewUrl}
                    preload="metadata"
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Play icon overlay */}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                      <Video className="w-2.5 h-2.5 text-white ml-0.5" />
                    </span>
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </span>
                </button>
              )}

              {/* ── Other file types (PDF, doc, txt…) ── */}
              {category === "other" && (
                <div className="shrink-0 w-12 h-12 rounded-md border border-border bg-muted flex flex-col items-center justify-center gap-0.5">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[9px] font-semibold text-muted-foreground leading-none">
                    {fileExtBadge(uploadedFile)}
                  </span>
                </div>
              )}

              {/* Filename + size */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-body text-foreground truncate">{uploadedFile.name}</span>
                <span className="text-caption text-muted-foreground shrink-0">
                  ({(uploadedFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>

              <button
                type="button"
                onClick={clearFile}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 pl-4">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                id="url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a link to a video, image, or article..."
                className="flex-1 bg-transparent text-body text-foreground placeholder:text-muted-foreground outline-none min-w-0 py-2"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                title="Upload a file instead"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload file"
          />
        </div>

        {/* Preview hint */}
        {(category === "image" || category === "video") && previewUrl && (
          <p className="text-caption text-center text-muted-foreground -mt-1">
            Click the thumbnail to confirm it&apos;s the right {category}
          </p>
        )}

        {isDragging && (
          <p className="text-caption text-center text-primary animate-pulse">
            Drop your file here
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={!hasInput || isLoading}>
          {isLoading ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              Analysing...
            </>
          ) : (
            "Understand this →"
          )}
        </Button>
      </form>

      {/* ── Lightbox — image or video ───────────────────────────────────────── */}
      {isLightboxOpen && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={category === "video" ? "Video preview" : "Image preview"}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" aria-hidden="true" />

          <div
            className="relative z-10 max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {category === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Full preview"
                className="block max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                autoPlay
                className="block max-w-full max-h-[85vh]"
              />
            )}

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-caption text-white/50 pointer-events-none">
            Click anywhere or press Esc to close
          </p>
        </div>
      )}
    </>
  );
}
