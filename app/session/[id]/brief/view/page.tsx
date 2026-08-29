import { createAdminClient } from "@/utils/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, MessageSquare, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("sessions").select("url, content_type").eq("id", id).single();
  return {
    title: data ? `View Session — Recrea8` : "Session",
    description: data?.url ?? "",
  };
}

export default async function ReadOnlyBriefPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("sessions")
    .select("id, url, content_type, brief, chat_messages, is_public")
    .eq("id", id)
    .single();

  if (!session || !session.is_public) notFound();

  const messages: { id: string; role: string; content: string }[] =
    (session.chat_messages as any[]) ?? [];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 md:px-8 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">Read-only showcase</span>
        </div>
        <div className="ml-auto">
          <Link
            href="/#hero"
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Wand2 className="w-4 h-4" />
            Try it yourself →
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-10">

        {/* Source URL badge */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Original source ({session.content_type})
          </p>
          {session.url.startsWith("upload://") ? (
            <span className="text-sm text-foreground font-mono bg-muted/40 border border-border rounded-lg px-3 py-2 inline-block">
              Uploaded file: {session.url.replace("upload://", "")}
            </span>
          ) : (
            <a
              href={session.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-mono bg-muted/40 border border-border rounded-lg px-3 py-2 inline-block truncate max-w-full"
            >
              {session.url}
            </a>
          )}
        </div>

        {/* Chat history */}
        {messages.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Creative conversation
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted border border-border text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Creative Brief */}
        {session.brief && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Creative Brief
              </h2>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed bg-card border border-border rounded-xl p-6">
              <ReactMarkdown>{session.brief}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-semibold text-foreground">
            Ready to recreate your own inspiration?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Wand2 className="w-4 h-4" />
            Start with Recrea8 — it&apos;s free
          </Link>
        </div>
      </div>
    </main>
  );
}
