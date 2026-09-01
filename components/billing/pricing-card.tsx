"use client";

import Link from "next/link";
import { CheckoutButton } from "@/components/billing/checkout-button";

interface Feature {
  label: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  creditsLabel: string;
  features: Feature[];
  cta: string;
  ctaLink: string | null;
  ctaDisabled: boolean;
  highlight: boolean;
  badge: string | null;
  priceId: string | null;
}

interface PricingCardProps {
  plan: Plan;
  userId: string;
  email: string;
  autoOpenCheckout?: boolean;
}

export function PricingCard({ plan, userId, email, autoOpenCheckout }: PricingCardProps) {
  return (
    <div
      className={`
        relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1
        ${plan.highlight
          ? "border-2 border-primary shadow-[0_8px_40px_oklch(0.65_0.2_280/0.12)] bg-card"
          : "border border-border/60 shadow-sm bg-card"
        }
      `}
    >
      {/* Popular badge */}
      {plan.badge && (
        <div
          className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-xl rounded-tr-2xl"
          style={{
            background: plan.highlight
              ? "linear-gradient(135deg, oklch(0.65 0.2 280), oklch(0.65 0.2 340))"
              : "linear-gradient(135deg, oklch(0.6 0.15 40), oklch(0.65 0.2 60))",
          }}
        >
          {plan.badge}
        </div>
      )}

      <div className="flex flex-col flex-1 p-6 sm:p-8 gap-5">
        {/* Header */}
        <div>
          <p className="text-label font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            {plan.name}
          </p>
          <div className="flex items-end gap-1 mb-2">
            <span className="text-4xl font-extrabold text-foreground tracking-tight">{plan.price}</span>
            {plan.period && (
              <span className="text-body font-medium text-muted-foreground mb-1.5">{plan.period}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{plan.tagline}</p>
        </div>

        {/* Credits pill */}
        <div
          className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-xs font-bold ${
            plan.highlight 
              ? "bg-primary/10 text-primary border border-primary/20" 
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 3.5V6.5L7.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {plan.creditsLabel}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/60" />

        {/* Features */}
        <ul className="flex flex-col gap-3.5 flex-1 mt-2">
          {plan.features.map((feature) => (
            <li key={feature.label} className="flex items-start gap-3">
              {feature.included ? (
                <svg
                  className="shrink-0 mt-0.5"
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    fill={plan.highlight ? "oklch(0.65 0.2 280 / 0.15)" : "currentColor"}
                    className={plan.highlight ? "" : "text-muted"}
                  />
                  <path
                    d="M5 8L7 10L11 6"
                    stroke={plan.highlight ? "oklch(0.65 0.2 280)" : "currentColor"}
                    className={plan.highlight ? "" : "text-foreground"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="shrink-0 mt-0.5 opacity-30"
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="7" fill="currentColor" className="text-muted" />
                  <path d="M5.5 10.5L10.5 5.5M5.5 5.5L10.5 10.5" stroke="currentColor" className="text-foreground" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              <span
                className={`text-sm font-medium leading-snug ${feature.included ? "text-foreground/90" : "text-muted-foreground/60 line-through"}`}
              >
                {feature.label}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="pt-4 mt-auto">
          {plan.priceId && userId ? (
            <CheckoutButton
              priceId={plan.priceId}
              userId={userId}
              email={email}
              planName={plan.name}
              autoOpen={autoOpenCheckout}
              className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                plan.highlight
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_oklch(0.65_0.2_280/0.3)]"
                  : "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
              }`}
            />
          ) : plan.ctaLink ? (
            <Link
              href={plan.ctaLink}
              id={`pricing-cta-${plan.name.toLowerCase()}`}
              className={`
                w-full flex items-center justify-center py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                ${plan.ctaDisabled
                  ? "bg-muted text-muted-foreground cursor-default pointer-events-none"
                  : "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                }
              `}
            >
              {plan.cta}
            </Link>
          ) : (
            <Link
              href={plan.priceId ? `/login?next=/pricing?checkout=${plan.priceId}` : "/login"}
              id={`pricing-cta-${plan.name.toLowerCase()}-login`}
              className={`
                w-full flex items-center justify-center py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                ${plan.highlight
                  ? "text-white shadow-[0_0_20px_oklch(0.65_0.2_280/0.3)]"
                  : "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                }
              `}
              style={
                plan.highlight
                  ? { background: "linear-gradient(135deg, oklch(0.65 0.2 280), oklch(0.65 0.2 340))" }
                  : undefined
              }
            >
              {plan.cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
