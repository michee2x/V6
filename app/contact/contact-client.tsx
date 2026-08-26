"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

const SUBJECT_LABELS: Record<string, string> = {
  whitelabel: "Whitelabel / Enterprise Enquiry",
  billing: "Billing Query",
  bug: "Report a Bug",
  feature: "Feature Request",
  general: "General Enquiry",
};

export function ContactPageClient() {
  const searchParams = useSearchParams();
  const rawSubject = searchParams.get("subject") ?? "general";
  const subjectLabel = SUBJECT_LABELS[rawSubject] ?? SUBJECT_LABELS.general;

  const [isLoading, setIsLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: `[${subjectLabel}]\n\n${formData.get("message")}`,
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send message");
      toast.success("Message sent! We will get back to you soon.");
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
          style={{ background: "oklch(0.65 0.15 150 / 0.2)", border: "1px solid oklch(0.65 0.15 150 / 0.4)" }}
        >
          ✓
        </div>
        <h2 className="text-h2 font-bold text-foreground">Message sent!</h2>
        <p className="text-body text-muted-foreground max-w-sm">
          Thanks for reaching out. Our team will be in touch within 1 business day.
        </p>
        <Link href="/" className="text-primary hover:underline text-sm mt-2">
          ← Back to Recrea8
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" id="contact-form">
      {/* Subject tag */}
      <div
        className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{
          background: "oklch(0.65 0.2 280 / 0.15)",
          border: "1px solid oklch(0.65 0.2 280 / 0.3)",
          color: "oklch(0.75 0.15 280)",
        }}
      >
        Re: {subjectLabel}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-name">Your name</Label>
        <Input id="contact-name" name="name" placeholder="Jane Smith" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-email">Email address</Label>
        <Input id="contact-email" name="email" type="email" placeholder="jane@example.com" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          placeholder={
            rawSubject === "whitelabel"
              ? "Tell us about your product, expected usage volume, and what you need from a whitelabel solution…"
              : "What's on your mind?"
          }
          rows={6}
          required
        />
      </div>
      <Button
        type="submit"
        id="contact-submit-btn"
        disabled={isLoading}
        className="mt-1 w-full"
      >
        {isLoading ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
