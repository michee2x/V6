import { createClient } from "@/utils/supabase/server";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Image, LogOut } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect("/login?error=unauthorized");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-muted/20 flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-foreground">
              Recrea<span className="text-primary">8</span>
            </span>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">Admin</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
            Showcase
          </Link>
          <Link
            href="/admin/sessions"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Image className="w-4 h-4" />
            All Sessions
          </Link>
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
