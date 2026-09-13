"use client";

import * as React from "react";
import Image from "next/image";

const steps = [
  {
    number: "01",
    title: "Paste or upload a Creative",
    description:
      "Find a TikTok, YouTube video, website or image you love. Paste the URL or upload it directly into Recrea8.",
    image: "/steps/step1.jpeg",
    imageAlt: "Pasting a link into the Recrea8 input form",
  },
  {
    number: "02",
    title: "Get the Master Prompt",
    description:
      "Our AI reverse-engineers the content - analysing the style, composition, and structure. Then generates a detailed Master Prompt.",
    image: "/steps/step2.jpeg",
    imageAlt: "The Master Prompt JSON card view in Recrea8",
  },
  {
    number: "03",
    title: "Recrea8 it",
    description:
      "Hit Recrea8 to instantly generate your own version. Download it or keep refining.",
    image: "/steps/step3.png",
    imageAlt: "Generated image output in Recrea8",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="w-full max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center gap-12"
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3 max-w-xl">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-primary/70">
          How it works
        </span>
        <h2
          id="how-it-works-heading"
          className="text-h2 md:text-h1 tracking-tight text-foreground"
        >
          Three steps. That&apos;s it.
        </h2>
        <p className="text-body text-muted-foreground">
          No learning curve. No prompt engineering skills needed - Just
          paste/upload, analyse, and ReCreate.
        </p>
      </div>

      {/* Steps — desktop: single row with arrows | mobile: vertical stack */}
      <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-8 md:gap-0">
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            {/* Step card */}
            <div className="flex flex-col items-center text-center gap-4">
              {/* Step number badge — mobile only */}
              <span className="md:hidden inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary tabular-nums">
                {step.number}
              </span>

              {/* Image card */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-border/60 bg-muted/20 shadow-xl shadow-black/10 aspect-video group">
                {/* Ambient glow on hover */}
                <div className="absolute -inset-2 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />

                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-contain object-center transition-transform duration-700 group-hover:scale-[1.015]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />

                {/* Inner border shine */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1.5 max-w-xs">
                <h3 className="text-h3 text-foreground">{step.title}</h3>
                <p className="text-body text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Arrow connector — between cards only, desktop only */}
            {idx < steps.length - 1 && (
              <div className="hidden md:flex items-center justify-center self-center px-2 mt-[-40px]">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-primary/40"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            {/* Vertical connector — between cards only, mobile only */}
            {idx < steps.length - 1 && (
              <div className="md:hidden flex flex-col items-center gap-1 py-1">
                <div className="w-px h-6 bg-border/60" />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-primary/40"
                >
                  <path
                    d="M12 5v14M6 13l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Bottom divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mt-4" />
    </section>
  );
}
