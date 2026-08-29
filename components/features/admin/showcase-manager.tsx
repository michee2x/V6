"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Trash2, Eye, EyeOff, Search, ChevronRight,
  Image, Video, FileText, Check, X, ExternalLink, Loader2,
  GripVertical, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShowcaseItem {
  id: string;
  session_id: string | null;
  content_type: "image" | "video" | "article";
  title: string;
  description: string | null;
  before_label: string;
  after_label: string;
  before_asset_url: string | null;
  after_asset_url: string | null;
  after_text_preview: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
}

interface SessionRow {
  id: string;
  url: string;
  content_type: string;
  brief: string | null;
  is_public: boolean;
  created_at: string;
}

interface Generation {
  id: string;
  type: string;
  model: string;
  data: string;
  mime_type: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <Image className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
  article: <FileText className="w-3.5 h-3.5" />,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractBeforeAsset(session: { url: string; fetched_content?: string }): string | null {
  const fc = (session as any).fetched_content ?? "";
  if (fc.startsWith("IMAGE_URL:")) return fc.replace("IMAGE_URL:", "").trim();
  if (fc.startsWith("IMAGE_BASE64:")) return fc.replace("IMAGE_BASE64:", "").trim();
  // Video: derive YouTube thumbnail
  const ytMatch = session.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShowcaseManager() {
  // Existing showcase items
  const [items, setItems] = React.useState<ShowcaseItem[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(true);

  // Session picker state
  const [sessions, setSessions] = React.useState<SessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = React.useState(false);
  const [sessionSearch, setSessionSearch] = React.useState("");
  const [sessionTypeFilter, setSessionTypeFilter] = React.useState("all");

  // Editor state
  const [editing, setEditing] = React.useState<Partial<ShowcaseItem> | null>(null);
  const [selectedSession, setSelectedSession] = React.useState<SessionRow | null>(null);
  const [generations, setGenerations] = React.useState<Generation[]>([]);
  const [loadingGens, setLoadingGens] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [view, setView] = React.useState<"list" | "edit">("list");

  // ── Load showcase items ───────────────────────────────────────────────────

  const loadItems = React.useCallback(async () => {
    setLoadingItems(true);
    const res = await fetch("/api/admin/showcase");
    if (res.ok) setItems((await res.json()).data ?? []);
    setLoadingItems(false);
  }, []);

  React.useEffect(() => { loadItems(); }, [loadItems]);

  // ── Load sessions for picker ──────────────────────────────────────────────

  const loadSessions = React.useCallback(async () => {
    setLoadingSessions(true);
    const params = new URLSearchParams({ q: sessionSearch, type: sessionTypeFilter, limit: "30" });
    const res = await fetch(`/api/admin/sessions?${params}`);
    if (res.ok) setSessions((await res.json()).data ?? []);
    setLoadingSessions(false);
  }, [sessionSearch, sessionTypeFilter]);

  React.useEffect(() => {
    if (view === "edit") loadSessions();
  }, [view, loadSessions]);

  // ── Pick a session ────────────────────────────────────────────────────────

  const pickSession = React.useCallback(async (session: SessionRow) => {
    setSelectedSession(session);
    setLoadingGens(true);
    try {
      const res = await fetch(`/api/admin/sessions/${session.id}/generations`);
      if (res.ok) {
        const json = await res.json();
        setGenerations(json.generations ?? []);
        const beforeAsset = extractBeforeAsset({ url: session.url, fetched_content: (json.session as any)?.fetched_content });
        setEditing(prev => ({
          ...prev,
          session_id: session.id,
          content_type: session.content_type as ShowcaseItem["content_type"],
          before_asset_url: beforeAsset ?? prev?.before_asset_url ?? null,
          after_text_preview: session.brief ? session.brief.slice(0, 300) : null,
        }));
      }
    } catch (error) {
      console.error("Failed to load generations:", error);
    } finally {
      setLoadingGens(false);
    }
  }, []);

  // ── Save item ─────────────────────────────────────────────────────────────

  const saveItem = async () => {
    if (!editing?.title || !editing?.content_type) {
      toast.error("Title and content type are required.");
      return;
    }
    setSaving(true);
    const isNew = !editing.id;
    const res = await fetch("/api/admin/showcase", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const json = await res.json();
    if (res.ok) {
      toast.success(isNew ? "Showcase item created!" : "Showcase item updated!");
      await loadItems();
      setView("list");
      setEditing(null);
      setSelectedSession(null);
    } else {
      toast.error(json.error ?? "Save failed.");
    }
    setSaving(false);
  };

  // ── Toggle publish ────────────────────────────────────────────────────────

  const togglePublish = async (item: ShowcaseItem) => {
    const res = await fetch("/api/admin/showcase", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, published: !item.published }),
    });
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, published: !i.published } : i));
      toast.success(item.published ? "Unpublished" : "Published to home page!");
    } else {
      toast.error("Failed to update.");
    }
  };

  // ── Delete item ───────────────────────────────────────────────────────────

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this showcase item?")) return;
    const res = await fetch("/api/admin/showcase", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("Deleted.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render: List view
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </h2>
            <button
              onClick={loadItems}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditing({ before_label: "Original", after_label: "Recrea8\u2019d", published: false, sort_order: items.length });
              setSelectedSession(null);
              setGenerations([]);
              setView("edit");
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add showcase item
          </Button>
        </div>

        {/* Items list */}
        {loadingItems ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border border-dashed border-border rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Image className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No showcase items yet. Add your first one!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(item => (
              <div
                key={item.id}
                className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-1 shrink-0" />

                {/* Before thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {item.before_asset_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.before_asset_url} alt="before" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No asset</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">{item.title}</span>
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1 py-0">
                      {TYPE_ICONS[item.content_type]}
                      {item.content_type}
                    </Badge>
                    {item.published ? (
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-0">Live</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground py-0">Draft</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  )}
                  {item.session_id && (
                    <a
                      href={`/session/${item.session_id}/brief/view`}
                      target="_blank"
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-1"
                    >
                      View read-only session <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => {
                      setEditing(item);
                      setSelectedSession(sessions.find(s => s.id === item.session_id) ?? null);
                      setGenerations([]);
                      setView("edit");
                    }}
                    title="Edit"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => togglePublish(item)}
                    title={item.published ? "Unpublish" : "Publish"}
                  >
                    {item.published ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-emerald-500" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-destructive hover:text-destructive"
                    onClick={() => deleteItem(item.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Edit view (two-column)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => { setView("list"); setEditing(null); }}>
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
        <h2 className="text-base font-semibold text-foreground">
          {editing?.id ? "Edit showcase item" : "New showcase item"}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Session picker */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">1. Pick a session</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by URL..."
                  className="pl-8 h-8 text-xs"
                  value={sessionSearch}
                  onChange={e => setSessionSearch(e.target.value)}
                />
              </div>
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                value={sessionTypeFilter}
                onChange={e => setSessionTypeFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="article">Article</option>
              </select>
              <Button size="sm" variant="outline" className="h-8" onClick={loadSessions}>
                {loadingSessions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </Button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {loadingSessions ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
              ) : sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No sessions found</p>
              ) : (
                sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => pickSession(session)}
                    className={cn(
                      "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all",
                      selectedSession?.id === session.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-muted/20 hover:border-primary/40 text-foreground"
                    )}
                  >
                    <span className="mt-0.5 shrink-0 text-muted-foreground">
                      {TYPE_ICONS[session.content_type] ?? <FileText className="w-3.5 h-3.5" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{session.url}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(session.created_at).toLocaleDateString()} · {session.content_type}
                        {session.is_public && " · public"}
                      </p>
                    </div>
                    {selectedSession?.id === session.id && <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Generations picker (after asset) */}
          {selectedSession && (
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">2. Pick &quot;After&quot; output</p>
              {loadingGens ? (
                <div className="flex gap-2">
                  {[1,2].map(i => <Skeleton key={i} className="h-20 w-20 rounded-lg" />)}
                </div>
              ) : generations.length === 0 ? (
                <p className="text-xs text-muted-foreground">No generations found for this session.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {generations.map(gen => {
                    const isImg = gen.type === "image";
                    const src = isImg ? `data:${gen.mime_type};base64,${gen.data}` : gen.data;
                    const isSelected = editing?.after_asset_url === src;
                    return (
                      <button
                        key={gen.id}
                        onClick={() => setEditing(prev => ({ ...prev, after_asset_url: src }))}
                        className={cn(
                          "relative w-20 h-20 rounded-lg border-2 overflow-hidden transition-all",
                          isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                        )}
                      >
                        {isImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="gen" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            {gen.type === "video" ? <Video className="w-6 h-6 text-muted-foreground" /> : <FileText className="w-6 h-6 text-muted-foreground" />}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">Or paste a URL manually below.</p>
            </div>
          )}
        </div>

        {/* Right: Metadata form */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
          <p className="text-sm font-semibold text-foreground">3. Fill in details</p>

          {/* Content type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Content type</label>
            <div className="flex gap-2">
              {(["image", "video", "article"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setEditing(prev => ({ ...prev, content_type: t }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    editing?.content_type === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {TYPE_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input
              placeholder="e.g. Mug product ad transformation"
              className="h-8 text-xs"
              value={editing?.title ?? ""}
              onChange={e => setEditing(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Input
              placeholder="Short caption shown on the card"
              className="h-8 text-xs"
              value={editing?.description ?? ""}
              onChange={e => setEditing(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Labels */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Before label</label>
              <Input
                className="h-8 text-xs"
                value={editing?.before_label ?? "Original"}
                onChange={e => setEditing(prev => ({ ...prev, before_label: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">After label</label>
              <Input
                className="h-8 text-xs"
                value={editing?.after_label ?? "Recrea8\u2019d"}
                onChange={e => setEditing(prev => ({ ...prev, after_label: e.target.value }))}
              />
            </div>
          </div>

          {/* Before asset URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Before asset URL (auto-filled or override)</label>
            <Input
              placeholder="https://... or leave blank"
              className="h-8 text-xs"
              value={editing?.before_asset_url ?? ""}
              onChange={e => setEditing(prev => ({ ...prev, before_asset_url: e.target.value || null }))}
            />
          </div>

          {/* After asset URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">After asset URL (auto-filled from generation or override)</label>
            <Input
              placeholder="https://... or base64 data URI"
              className="h-8 text-xs"
              value={editing?.after_asset_url ?? ""}
              onChange={e => setEditing(prev => ({ ...prev, after_asset_url: e.target.value || null }))}
            />
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <label className="text-xs font-medium text-muted-foreground">Publish to home page</label>
            <button
              onClick={() => setEditing(prev => ({ ...prev, published: !prev?.published }))}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full border-2 transition-colors",
                editing?.published ? "bg-primary border-primary" : "bg-muted border-border"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
                  editing?.published ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {/* Save button */}
          <Button
            className="w-full mt-2"
            disabled={!editing?.title || !editing?.content_type || saving}
            onClick={saveItem}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {editing?.id ? "Save changes" : "Create item"}
          </Button>
        </div>
      </div>
    </div>
  );
}
