import { InputForm } from "@/components/features/input/input-form";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { HowItWorks } from "@/components/features/onboarding/how-it-works";
import { InspirationGallery } from "@/components/features/inspiration/inspiration-gallery";
import { BeforeAfterShowcase } from "@/components/features/showcase/before-after-showcase";
import { PricingSection } from "@/components/pricing/pricing-section";

export const metadata = {
  title: "Recrea8 — Paste a link, understand it. Create from it.",
  description:
    "Paste any link — a video, image, or article — and get an instant breakdown. Then turn it into a ready-to-use creative brief in seconds.",
};

export default function HomePage() {
  return (
    <main className="relative flex flex-col flex-1 items-center px-4 overflow-x-hidden">
      {/* Background Effect */}
      <GoogleGeminiEffect />

      <section className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center min-h-screen gap-10">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-4 mt-20">
          <div className="group relative mx-auto flex items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f]">
            {/* Animated gradient border wrapper */}
            <div className="animate-gradient absolute inset-0 -z-10 block rounded-[inherit] bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 bg-[length:300%_100%] p-[1px]">
              {/* Inner background to hollow out the border */}
              <div className="h-full w-full rounded-[inherit] bg-background/90 backdrop-blur-sm" />
            </div>
            🎉 <hr className="mx-2 h-4 w-px shrink-0 bg-border" />
            <AnimatedGradientText className="text-sm font-medium">
              Beta — free to try, no account needed
            </AnimatedGradientText>
          </div>
          <h1 className="text-display tracking-tight text-foreground">
            See something you like online?{" "}
            <span className="text-muted-foreground">Recrea8 it.</span>
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-prose">
            Paste a link or upload a creative. Recrea8 reverse-engineers how it
            works, lets you make it yours, and generates the finished version in
            minutes.
          </p>
        </div>

        {/* Input */}
        <InputForm />

        {/* Social proof nudge */}
        <p className="text-caption text-muted-foreground">
          No signup needed for your first run · Supports YouTube, TikTok, images &amp; articles
        </p>
      </section>

      <section className="relative z-10 w-full flex flex-col items-center gap-10 pb-20">
        {/* How it Works */}
        <HowItWorks />

        {/* Gallery */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-10 px-4">
          <InspirationGallery />
        </div>
      </section>

      {/* Full width showcase */}
      <BeforeAfterShowcase />

      {/* Pricing Section */}
      <PricingSection />
    </main>
  );
}
