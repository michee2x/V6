import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { PricingCard } from "@/components/billing/pricing-card";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the plan that works for you. Start free, upgrade when you're ready. Recrea8 pricing plans: Free, Starter, Growth, and Pro.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function PricingPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const checkoutId = searchParams?.checkout;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const starterPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER ?? "";
  const growthPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_GROWTH ?? "";
  const proPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO ?? "";

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      tagline: "Get started, no card needed.",
      creditsLabel: "30 one-time credits",
      features: [
        { label: "30 starter credits (one-time)", included: true },
        { label: "Basic text generation", included: true },
        { label: "Standard image quality only", included: true },
        { label: "Analysis history", included: true },
        { label: "Video generation", included: false },
        { label: "4K image generation", included: false },
        { label: "Extended text outputs", included: false },
        { label: "Priority processing", included: false },
      ],
      cta: user ? "You're on Free" : "Get Started",
      ctaLink: user ? "/session" : "/login",
      ctaDisabled: !!user,
      highlight: false,
      badge: null,
      priceId: null,
    },
    {
      name: "Starter",
      price: "$7",
      period: "/ month",
      tagline: "For creators ramping up.",
      creditsLabel: "500 credits / month",
      features: [
        { label: "500 credits per month", included: true },
        { label: "Extended text generation", included: true },
        { label: "Standard image quality (up to 2K)", included: true },
        { label: "Full analysis history", included: true },
        { label: "Video generation", included: true },
        { label: "4K image generation", included: false },
        { label: "Extended text outputs", included: true },
        { label: "Priority processing", included: false },
      ],
      cta: "Upgrade to Starter",
      ctaLink: null,
      ctaDisabled: false,
      highlight: false,
      badge: null,
      priceId: starterPriceId,
    },
    {
      name: "Growth",
      price: "$21",
      period: "/ month",
      tagline: "For serious content creators.",
      creditsLabel: "2,000 credits / month",
      features: [
        { label: "2,000 credits per month", included: true },
        { label: "Full text generation (no limits)", included: true },
        { label: "4K image generation", included: true },
        { label: "Full analysis history", included: true },
        { label: "Video generation", included: true },
        { label: "Extended text outputs", included: true },
        { label: "Priority processing", included: true },
        { label: "Early access to new features", included: true },
      ],
      cta: "Upgrade to Growth",
      ctaLink: null,
      ctaDisabled: false,
      highlight: true,
      badge: "Most Popular",
      priceId: growthPriceId,
    },
    {
      name: "Pro",
      price: "$49",
      period: "/ month",
      tagline: "For agencies & power users.",
      creditsLabel: "5,000 credits / month",
      features: [
        { label: "5,000 credits per month", included: true },
        { label: "Full text generation (no limits)", included: true },
        { label: "4K image generation", included: true },
        { label: "Full analysis history", included: true },
        { label: "Video generation", included: true },
        { label: "Extended text outputs", included: true },
        { label: "Priority processing", included: true },
        { label: "Early access to new features", included: true },
      ],
      cta: "Upgrade to Pro",
      ctaLink: null,
      ctaDisabled: false,
      highlight: false,
      badge: "Best Value",
      priceId: proPriceId,
    },
  ];

  return (
    <main className="flex-1 w-full">
      {/* Hero */}
      <section className="relative w-full overflow-hidden py-24 pb-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse at center, oklch(0.65 0.2 280) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-20 left-[10%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse at center, oklch(0.65 0.15 340) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 right-[10%] w-[250px] h-[250px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse at center, oklch(0.65 0.15 190) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Simple, credit-based pricing
          </div>
          <h1 className="text-display font-bold text-foreground mb-5 leading-tight">
            Pay for what you{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, oklch(0.65 0.2 280), oklch(0.65 0.2 340))" }}
            >
              actually use
            </span>
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Start with 30 free credits — no card required. When you&apos;re ready to do more, pick a plan and top up monthly.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              userId={user?.id ?? ""}
              email={user?.email ?? ""}
              autoOpenCheckout={checkoutId === plan.priceId}
            />
          ))}
        </div>
      </section>

      {/* Credit Usage Table */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div
          className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card"
        >
          <div className="px-6 py-5 border-b border-border/60">
            <h2 className="text-h3 font-semibold text-foreground">How credits work</h2>
            <p className="text-body text-muted-foreground mt-1">Each action costs credits. Here&apos;s a rough guide:</p>
          </div>
          <div className="divide-y divide-border/60">
            {[
              { action: "Analyse a video / article", cost: "2–5 credits" },
              { action: "Generate a standard image", cost: "3 credits" },
              { action: "Generate a 4K image", cost: "8 credits" },
              { action: "Generate a video clip", cost: "10–20 credits" },
              { action: "Generate a text brief (basic)", cost: "1 credit" },
              { action: "Generate a text brief (extended)", cost: "3 credits" },
            ].map((row) => (
              <div
                key={row.action}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors duration-150"
              >
                <span className="text-body text-foreground">{row.action}</span>
                <span className="text-body font-medium text-primary">{row.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Whitelabel / Enterprise Banner */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center border shadow-xl shadow-primary/5"
          style={{
            background: "linear-gradient(135deg, oklch(0.98 0.02 280) 0%, oklch(1 0 250) 50%, oklch(0.96 0.03 340) 100%)",
            borderColor: "oklch(0.85 0.05 280)",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-50"
            style={{ background: "radial-gradient(ellipse at 50% -20%, oklch(0.65 0.2 280) 0%, transparent 60%)" }}
          />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-bold mb-6 shadow-sm">
              🏢 Enterprise &amp; Whitelabel
            </div>
            <h2 className="text-h1 font-bold text-foreground mb-4">Want to power your own branded product?</h2>
            <p className="text-body-lg text-muted-foreground font-medium max-w-2xl mx-auto mb-8">
              We offer custom whitelabel solutions for agencies and enterprises who want to embed Recrea8&apos;s AI engine under their own brand. Let&apos;s talk.
            </p>
            <Link
              href="/contact?subject=whitelabel"
              id="whitelabel-contact-cta"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.2 280), oklch(0.65 0.2 340))",
                boxShadow: "0 8px 32px oklch(0.65 0.2 280 / 0.35)",
              }}
            >
              Contact Support →
            </Link>
            <p className="text-sm font-medium text-muted-foreground/80 mt-6">We typically respond within 1 business day.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-h2 font-bold text-foreground text-center mb-10">Common questions</h2>
        <div className="space-y-4">
          {[
            { q: "Do my credits roll over?", a: "No — unused credits reset at the start of each billing cycle. Use them or lose them!" },
            { q: "Can I switch plans at any time?", a: "Yes. You can upgrade or downgrade at any time. Changes take effect immediately and are prorated." },
            { q: "What happens when I run out of credits?", a: "You will be prompted to upgrade your plan. You won't lose your account or history." },
            { q: "Is the Free tier really free forever?", a: "Yes. You get 30 one-time credits with no time limit and no credit card required. They just don't top up each month." },
            { q: "What payment methods do you accept?", a: "We accept all major credit and debit cards, as well as PayPal, via Paddle — our trusted payment processor." },
          ].map((faq) => (
            <details key={faq.q} className="group rounded-xl border border-border/60 overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none hover:bg-muted/40 transition-colors duration-150 list-none">
                <span className="text-body font-medium text-foreground">{faq.q}</span>
                <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-45 shrink-0 text-xl leading-none">+</span>
              </summary>
              <div className="px-5 pb-4 text-body text-muted-foreground">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
