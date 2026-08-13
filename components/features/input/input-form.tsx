"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Link2, Upload, FileImage, Video, Newspaper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ContentType = "auto" | "video" | "image" | "article";

const contentTypes: { value: ContentType; label: string; icon: React.ElementType }[] = [
  { value: "auto", label: "Auto", icon: Link2 },
  { value: "video", label: "Video", icon: Video },
  { value: "image", label: "Image", icon: FileImage },
  { value: "article", label: "Article", icon: Newspaper },
];

export function InputForm() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [contentType, setContentType] = React.useState<ContentType>("auto");
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasInput = url.trim().length > 0 || uploadedFile !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasInput || isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), contentType }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const message =
          data?.error?.message ?? "Something went wrong. Please try again.";
        toast.error(message);
        setIsLoading(false);
        return;
      }

      const { sessionId, contentType: resolvedType } = data.data;
      router.push(
        `/session/${sessionId}?url=${encodeURIComponent(url)}&type=${resolvedType}`
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
    if (file) {
      setUploadedFile(file);
      setUrl("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUrl("");
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
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
          /* File chip */
          <div className="flex items-center gap-3 p-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
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
          /* URL input */
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

      {/* Drop hint */}
      {isDragging && (
        <p className="text-caption text-center text-primary animate-pulse">
          Drop your file here
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!hasInput || isLoading}
      >
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
  );
}
