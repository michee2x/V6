import { createAdminClient } from "@/utils/supabase/admin";
import { Mail, Calendar, User, Paperclip, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Admin — Contact Message Detail" };

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
};

async function getContactMessage(id: string): Promise<ContactMessage | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, message, attachment_url, created_at")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Failed to fetch contact message:", error);
      return null;
    }
    return data as ContactMessage;
  } catch {
    return null;
  }
}

async function getSignedUrl(publicUrl: string): Promise<string> {
  try {
    const supabase = createAdminClient();
    const urlParts = publicUrl.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0];
    
    // Generate a signed URL valid for 1 hour
    const { data, error } = await supabase.storage
      .from("contact_attachments")
      .createSignedUrl(fileName, 60 * 60);

    if (error || !data) {
      console.error("Failed to generate signed URL:", error);
      return publicUrl; // Fallback to the original URL if it fails
    }
    return data.signedUrl;
  } catch {
    return publicUrl; // Fallback
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

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const msg = await getContactMessage(resolvedParams.id);

  if (!msg) {
    notFound();
  }

  const { subject, body } = parseMessage(msg.message);
  const subjectClass =
    subject && SUBJECT_COLORS[subject]
      ? SUBJECT_COLORS[subject]
      : "bg-muted text-muted-foreground border-border";

  let attachmentSrc = msg.attachment_url;
  if (attachmentSrc) {
    attachmentSrc = await getSignedUrl(attachmentSrc);
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link 
          href="/admin/contact"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to messages
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(msg.created_at)}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-lg font-semibold text-foreground truncate">
                {msg.name}
              </span>
            </div>
            <a
              href={`mailto:${msg.email}`}
              className="text-sm text-primary hover:underline ml-6"
            >
              {msg.email}
            </a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {subject && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${subjectClass}`}
              >
                {subject}
              </span>
            )}
          </div>
        </div>

        <div className="h-px bg-border w-full" />

        {/* Message body */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Message</h3>
          <div className="rounded-xl bg-muted/40 border border-border/60 px-5 py-4">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {body}
            </p>
          </div>
        </div>

        {/* Attachment */}
        {attachmentSrc && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Attachment</h3>
            <div className="mt-2 flex flex-col items-start gap-4">
              <a
                href={attachmentSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline bg-primary/10 px-4 py-2 rounded-lg border border-primary/20"
              >
                <Paperclip className="w-4 h-4" />
                Open Attachment
              </a>
              
              {/* Preview logic for images */}
              {(attachmentSrc.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) && (
                <div className="rounded-xl overflow-hidden border border-border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachmentSrc} alt="Attachment preview" className="w-full max-w-2xl h-auto object-contain max-h-[600px]" />
                </div>
              )}
              
              {/* Preview logic for videos */}
              {(attachmentSrc.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) && (
                <div className="rounded-xl overflow-hidden border border-border bg-black max-w-2xl w-full">
                  <video src={attachmentSrc} controls className="w-full h-auto max-h-[600px]" />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="h-px bg-border w-full mt-2" />

        {/* Reply CTA */}
        <div className="flex justify-end">
          <a
            href={`mailto:${msg.email}?subject=Re: ${subject ?? "Your message to Recrea8"}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline bg-primary/10 px-5 py-2.5 rounded-lg border border-primary/20 transition-colors hover:bg-primary/20"
          >
            <Mail className="w-4 h-4" />
            Reply via email
          </a>
        </div>
      </div>
    </div>
  );
}
