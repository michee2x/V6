import { createAdminClient } from "@/utils/supabase/admin";
import { Mail, Calendar, User, Paperclip } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin — Contact Messages" };

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
};

async function getContactMessages(): Promise<ContactMessage[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, message, attachment_url, created_at")
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

            // Truncate body for preview
            const snippet = body.length > 80 ? body.substring(0, 80) + "..." : body;

            return (
              <Link
                key={msg.id}
                href={`/admin/contact/${msg.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 min-w-0 flex-1">
                  {/* Sender Info */}
                  <div className="flex items-center gap-3 shrink-0 sm:w-48">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {msg.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {msg.email}
                      </span>
                    </div>
                  </div>

                  {/* Subject & Snippet */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
                    {subject && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${subjectClass}`}
                      >
                        {subject}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors">
                      {snippet}
                    </span>
                  </div>
                </div>

                {/* Metadata (Date & Attachments) */}
                <div className="flex items-center gap-4 shrink-0 mt-2 sm:mt-0">
                  {msg.attachment_url && (
                    <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attachment</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(msg.created_at)}
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
