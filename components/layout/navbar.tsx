import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContactModal } from "@/components/features/contact/contact-modal";
import { CreditCounter } from "@/components/layout/credit-counter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, History, LogOut } from "lucide-react";

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
        <div className="flex items-center space-x-3 sm:space-x-6">
          <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <ContactModal />
          {user ? (
            <>
              <CreditCounter />
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full outline-none")}>
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">User menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.email && (
                        <p className="font-medium text-sm text-muted-foreground truncate">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer p-0">
                    <Link href="/history" className="flex w-full items-center px-2 py-1.5">
                      <History className="mr-2 h-4 w-4" />
                      <span>History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive p-0">
                    <form action={logout} className="w-full">
                      <button type="submit" className="flex w-full items-center px-2 py-1.5">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
