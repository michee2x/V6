import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background mt-auto">
      <div className="container max-w-screen-2xl mx-auto px-4 py-10 flex flex-col items-center gap-4 text-center">
        {/* Brand wordmark — visible HTML text for Google verification */}
        <p className="text-2xl font-bold tracking-tight text-foreground">
          Recrea8
        </p>
        <p className="text-caption text-muted-foreground max-w-xs">
          Paste any link. Understand it. Create from it.
        </p>

        {/* Legal links */}
        <nav className="flex items-center gap-6 text-caption text-muted-foreground" aria-label="Footer legal links">
          <Link
            href="/policy"
            className="hover:text-foreground transition-colors duration-150"
          >
            Privacy Policy
          </Link>
          <span className="opacity-30">·</span>
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors duration-150"
          >
            Terms of Service
          </Link>
        </nav>

        <p className="text-caption text-muted-foreground/60">
          © {year} Recrea8. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
