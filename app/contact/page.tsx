import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactPageClient } from "./contact-client";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Recrea8 team for support, whitelabel enquiries, or general questions.",
};

export default function ContactPage() {
  return (
    <main className="flex-1 w-full max-w-xl mx-auto px-4 py-16">
      <Link
        href="/"
        className="text-caption text-muted-foreground hover:text-foreground transition-colors duration-150 inline-flex items-center gap-1 mb-8"
      >
        ← Back to Recrea8
      </Link>

      <div className="mb-8">
        <h1 className="text-h1 font-bold text-foreground mb-2">Get in touch</h1>
        <p className="text-body text-muted-foreground">
          Have a question or want to discuss a custom solution? We would love to hear from you.
        </p>
      </div>

      <div
        className="rounded-2xl border border-border/60 p-8"
        style={{ background: "oklch(0.18 0.03 250 / 0.6)", backdropFilter: "blur(12px)" }}
      >
        <Suspense fallback={<div className="text-muted-foreground text-body py-4">Loading…</div>}>
          <ContactPageClient />
        </Suspense>
      </div>

      <p className="text-caption text-muted-foreground text-center mt-6">
        Or email us directly at{" "}
        <a href="mailto:hello@recrea8.app" className="text-primary hover:underline">
          hello@recrea8.app
        </a>
      </p>
    </main>
  );
}
