import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { ContactModal } from "@/components/features/contact/contact-modal";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          {/* Image logo hidden — CSS text replica shown for Google OAuth branding verification */}
          <Image src="/logo.webp" alt="Recrea8" width={120} height={40} className="hidden" priority />
          <span className="font-bold text-xl tracking-tight text-foreground select-none" aria-label="Recrea8">
            Recrea<span className="text-primary">8</span>
          </span>
        </Link>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <ContactModal />
          {user ? (
            <>
              <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                History
              </Link>
              <form action={logout}>
                <Button variant="ghost" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
