import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analysing — Conduit",
};

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal top nav for the app shell */}
      <header className="border-b border-border h-14 flex items-center px-6 shrink-0">
        <a href="/" className="text-label font-semibold text-foreground tracking-tight">
          Conduit
        </a>
        <div className="flex-1" />
        <a
          href="/"
          className="text-label text-muted-foreground hover:text-foreground transition-colors"
        >
          ← New session
        </a>
      </header>
      <div className="flex-1 flex">{children}</div>
    </div>
  );
}
