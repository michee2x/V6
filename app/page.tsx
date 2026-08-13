import { InputForm } from "@/components/features/input/input-form";

export const metadata = {
  title: "v6 — Paste a link, understand it. Create from it.",
  description:
    "Paste any link — a video, image, or article — and get an instant breakdown. Then turn it into a ready-to-use creative brief in seconds.",
};

export default function HomePage() {
  return (
    <main className="flex flex-col flex-1 items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-4">
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
            Beta — free to try, no account needed
          </span>
          <h1 className="text-display tracking-tight text-foreground">
            Paste a link.
            <br />
            <span className="text-muted-foreground">Understand it. Create from it.</span>
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-prose">
            Drop in any video, image, or article. Get an instant breakdown of
            what makes it work — then turn that into a creative brief you can
            render or export anywhere.
          </p>
        </div>

        {/* Input */}
        <InputForm />

        {/* Social proof nudge */}
        <p className="text-caption text-muted-foreground">
          No signup needed for your first run · Supports YouTube, TikTok, images &amp; articles
        </p>
      </div>
    </main>
  );
}
