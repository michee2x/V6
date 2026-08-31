import { createClient } from "@/utils/supabase/server";
import { Mail, Calendar, User } from "lucide-react";

export const metadata = { title: "Admin — Contact Messages" };

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

async function getContactMessages(): Promise<ContactMessage[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, message, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch contact messages:", error);
      return [];
    }
    return (data as ContactMessage[]) ?? [];
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Extract subject from message if it was prepended by the form e.g. "[Billing Query]\n\n..."
function parseMessage(raw: string): { subject: string | null; body: string } {
  const match = raw.match(/^\[([^\]]+)\]\n\n([\s\S]*)$/);
  if (match) return { subject: match[1], body: match[2] };
  return { subject: null, body: raw };
}

const SUBJECT_COLORS: Record<string, string> = {
  "Whitelabel / Enterprise Enquiry": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Billing Query":                   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Report a Bug":                    "bg-red-500/10 text-red-400 border-red-500/20",
  "Feature Request":                 "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "General Enquiry":                 "bg-primary/10 text-primary border-primary/20",
};

export default async function AdminContactPage() {
  const messages = await getContactMessages();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All submissions from the /contact form.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{messages.length}</span>
          <span className="text-xs text-muted-foreground">total</span>
        </div>
      </div>

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-2xl border border-dashed border-border">
          <Mail className="w-10 h-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Messages submitted via /contact will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Message list */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const { subject, body } = parseMessage(msg.message);
            const subjectClass =
              subject && SUBJECT_COLORS[subject]
                ? SUBJECT_COLORS[subject]
                : "bg-muted text-muted-foreground border-border";

            return (
              <div
                key={msg.id}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors"
              >
                {/* Top row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold text-foreground truncate">
                        {msg.name}
                      </span>
                    </div>
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-xs text-primary hover:underline ml-5"
                    >
                      {msg.email}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {subject && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${subjectClass}`}
                      >
                        {subject}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(msg.created_at)}
                    </div>
                  </div>
                </div>

                {/* Message body */}
                <div className="rounded-xl bg-muted/40 border border-border/60 px-4 py-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {body}
                  </p>
                </div>

                {/* Reply CTA */}
                <div className="flex justify-end">
                  <a
                    href={`mailto:${msg.email}?subject=Re: ${subject ?? "Your message to Recrea8"}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <Mail className="w-3 h-3" />
                    Reply via email
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
