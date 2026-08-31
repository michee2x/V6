"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    title: "Paste a link",
    description:
      "Find a TikTok, YouTube video, or image you love. Copy the URL and paste it directly into Recrea8.",
    image: "/images/how-it-works-1.png",
    imageAlt: "Pasting a link into the Recrea8 input form",
    badge: "Any link works",
  },
  {
    number: "02",
    title: "Get the Master Prompt",
    description:
      "Our AI reverse-engineers the content — analysing the style, composition, lighting, and structure — then generates a detailed Master Prompt.",
    image: "/images/how-it-works-2.png",
    imageAlt: "The Master Prompt JSON card view in Recrea8",
    badge: "AI-powered analysis",
  },
  {
    number: "03",
    title: "Recrea8 it",
    description:
      "Hit Recrea8 to instantly generate your own inspired version. Download it or keep refining until it's exactly right.",
    image: "/images/how-it-works-3.png",
    imageAlt: "Generated image output in Recrea8",
    badge: "Your version, instantly",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="w-full max-w-5xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center gap-12"
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
          No learning curve. No prompt engineering expertise needed. Just paste,
          analyse, and generate.
        </p>
      </div>

      {/* Steps */}
      <div className="w-full flex flex-col gap-16 md:gap-24">
        {steps.map((step, idx) => (
          <div
            key={step.number}
            className={cn(
              "flex flex-col md:flex-row items-center gap-8 md:gap-12",
              idx % 2 === 1 && "md:flex-row-reverse"
            )}
          >
            {/* Text side */}
            <div className="flex flex-col gap-4 flex-1 md:max-w-md">
              <div className="flex items-center gap-3">
                <span className="text-[52px] font-black leading-none text-foreground/8 select-none tabular-nums">
                  {step.number}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {step.badge}
                </span>
              </div>
              <h3 className="text-h3 text-foreground">{step.title}</h3>
              <p className="text-body text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Screenshot side */}
            <div className="flex-1 w-full">
              <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-muted/20 shadow-2xl shadow-black/10 aspect-video group">
                {/* Ambient glow on hover */}
                <div className="absolute -inset-2 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />

                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.015]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />

                {/* Placeholder — shown while screenshots not yet added */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/30 pointer-events-none select-none">
                  <span className="text-6xl font-black tabular-nums">{step.number}</span>
                  <p className="text-[11px] font-semibold uppercase tracking-widest">
                    Screenshot coming soon
                  </p>
                  <code className="text-[10px] opacity-60 mt-1">
                    public{step.image}
                  </code>
                </div>

                {/* Subtle inner border shine */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mt-4" />
    </section>
  );
}
