import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { FileImage, FileVideo, FileText, ArrowRight, Clock, Sparkles } from "lucide-react";

export const metadata = { title: "Your History — Recrea8" };

function getTitle(session: any) {
  // Use URL / filename as primary identifier, but clean it up
  let title = session.url.replace("upload://", "");
  if (title.startsWith("http")) {
    try {
      const u = new URL(title);
      title = u.hostname + (u.pathname.length > 1 ? u.pathname : "");
    } catch (e) {}
  }
  return decodeURIComponent(title);
}

function getTypeIcon(type: string) {
  switch (type) {
    case "image":
      return <FileImage className="w-4 h-4" />;
    case "video":
      return <FileVideo className="w-4 h-4" />;
    case "article":
      return <FileText className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

function getStatusBadge(session: any) {
  if (session.brief) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <Sparkles className="w-3 h-3" />
        Master Prompt
      </span>
    );
  }
  if (session.advanced_insight) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
        Advanced Analysis
      </span>
    );
  }
  if (session.basic_insight) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
        Basic Analysis
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
      Analyzing...
    </span>
  );
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching history:", error);
    return <div>Error loading history</div>;
  }

  return (
    <div className="container max-w-5xl mx-auto py-12 px-6">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Your History
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-md">
            Review your past analysis and generated master prompts. Revisit any session to continue editing or generating new content.
          </p>
        </div>
      </div>

      {(!sessions || sessions.length === 0) ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-3xl border border-dashed border-border bg-card/50">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary/60" />
          </div>
          <div>
            <p className="font-semibold text-lg text-foreground">No history yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Your generated master prompts and analysis will appear here.
            </p>
          </div>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => {
            const created = new Date(session.created_at);
            return (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="group relative flex flex-col rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Subtle gradient glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground/5 text-foreground/70 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {getTypeIcon(session.content_type)}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                        {session.content_type}
                      </span>
                    </div>
                    {getStatusBadge(session)}
                  </div>

                  <h3 className="text-base font-bold text-foreground line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                    {getTitle(session)}
                  </h3>

                  <div className="mt-auto pt-6 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Created
                      </span>
                      <span className="text-xs text-foreground/80 font-medium">
                        {format(created, "MMM d, yyyy")} <span className="text-muted-foreground/60">•</span> {format(created, "h:mm a")}
                      </span>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className="w-4 h-4 text-foreground" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
