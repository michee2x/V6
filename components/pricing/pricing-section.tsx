import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { PricingCard } from "@/components/billing/pricing-card";
import { WhitelabelCard } from "@/components/pricing/whitelabel-card";

export async function PricingSection() {
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
        { label: "HD image generation", included: true },
        { label: "Analysis history", included: true },
        { label: "Video generation", included: false },
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
        { label: "HD image generation", included: true },
        { label: "Full analysis history", included: true },
        { label: "Video generation", included: true },
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
        { label: "HD image generation", included: true },
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
        { label: "HD image generation", included: true },
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
    <section id="pricing" className="w-full flex-col flex bg-background relative z-10 pt-20 border-t border-border">
      {/* Hero */}
      <div className="relative w-full overflow-hidden pb-16">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Simple, credit-based pricing
          </div>
          <h2 className="text-display font-bold text-foreground mb-5 leading-tight">
            Pay for what you{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, oklch(0.65 0.2 280), oklch(0.65 0.2 340))" }}
            >
              actually use
            </span>
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Start with 30 free credits — no card required. When you&apos;re ready to do more, pick a plan and top up monthly.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl w-full mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              userId={user?.id ?? ""}
              email={user?.email ?? ""}
              autoOpenCheckout={false}
            />
          ))}
        </div>
      </div>

      {/* Whitelabel + FAQ unified section */}
      <div className="max-w-5xl w-full mx-auto px-4 pb-24">
        {/* Section header */}
        <div className="text-center mb-10">
          <h3 className="text-h2 font-bold text-foreground">Common questions &amp; Enterprise</h3>
          <p className="text-body text-muted-foreground mt-2">Everything you need to know before you get started.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Left — Whitelabel Card */}
          <div className="w-full lg:w-80 lg:shrink-0">
            <div className="sticky top-8">
              <WhitelabelCard
                user={
                  user
                    ? {
                        name:
                          user.user_metadata?.full_name ??
                          user.user_metadata?.name ??
                          user.email?.split("@")[0] ??
                          "User",
                        email: user.email ?? "",
                      }
                    : null
                }
              />
            </div>
          </div>

          {/* Vertical divider — desktop only */}
          <div className="hidden lg:block w-px self-stretch bg-border/50 shrink-0" />

          {/* Right — FAQ */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Group: About ReCrea8 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">About ReCrea8</p>
              <div className="space-y-2">
                {[
                  {
                    q: "What exactly does ReCrea8 do?",
                    a: "ReCrea8 analyzes something you found online — an image, video, URL, or article — breaks down how it was made, and turns it into a Power Prompt you can customize and generate.",
                  },
                  {
                    q: "Does ReCrea8 make exact copies?",
                    a: "No. ReCrea8 recreates the creative approach — the layout, pacing, tone, and structure — not the protected brand assets themselves. Logos and trademarks are automatically detected and replaced, not reproduced. You customize the result to make it yours before you generate.",
                  },
                  {
                    q: "Do I need to know how to write AI prompts?",
                    a: "No. ReCrea8 generates the Power Prompt from your reference automatically, and you can shape the result further just by chatting with the ReCrea8 Agent in plain language.",
                  },
                  {
                    q: "Which AI models does ReCrea8 use?",
                    a: "ReCrea8 automatically selects the right model for each job — including OpenAI, Claude, Gemini, Flux, and specialized video models — so you never have to choose one yourself.",
                  },
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
            </div>

            {/* Group: Billing */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Billing</p>
              <div className="space-y-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* How credits work section */}
      <div className="max-w-3xl w-full mx-auto px-4 pb-24">
        <div className="text-center mb-10">
          <h3 className="text-h2 font-bold text-foreground">How credits work</h3>
          <p className="text-body text-muted-foreground mt-2">Each action costs credits. Here&apos;s a rough guide:</p>
        </div>
        
        <div className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card">
          <div className="divide-y divide-border/60">
            {[
              { action: "Analyse a video / article", cost: "2–5 cr" },
              { action: "Generate an HD image", cost: "3 cr" },
              { action: "Generate a video clip", cost: "10–20 cr" },
              { action: "Text brief (basic)", cost: "1 cr" },
              { action: "Text brief (extended)", cost: "3 cr" },
            ].map((row) => (
              <div
                key={row.action}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors duration-150"
              >
                <span className="text-body font-medium text-foreground">{row.action}</span>
                <span className="text-body font-bold text-primary shrink-0 ml-3">{row.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
