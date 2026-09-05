import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background mt-auto">
      <div className="container max-w-screen-2xl mx-auto px-4 py-10 flex flex-col items-center gap-4 text-center">
        <p className="text-2xl font-bold tracking-tight text-foreground">
          ReCrea8
        </p>
        <p className="text-caption text-muted-foreground max-w-xs">
          Stop wondering how they made it. ReCrea8 it.
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
          © {year} ReCrea8. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
