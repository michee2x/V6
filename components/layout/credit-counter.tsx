import Link from "next/link";
import { Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export async function CreditCounter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("credits_remaining, plan")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  const credits = data.credits_remaining ?? 0;
  const plan = data.plan ?? "free";

  // Color coding: low = amber warning, empty = red, healthy = default
  const isEmpty = credits <= 0;
  const isLow   = credits > 0 && credits <= 10;

  return (
    <Link
      href="/#pricing"
      title={`${credits} credits remaining — click to upgrade`}
      className={[
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors",
        isEmpty
          ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
          : isLow
          ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
          : "border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
      ].join(" ")}
      id="credit-counter-link"
    >
      <Zap
        className={[
          "w-3 h-3",
          isEmpty ? "text-destructive" : isLow ? "text-amber-500" : "text-primary",
        ].join(" ")}
      />
      <span>{credits}</span>
      {isEmpty && <span className="hidden sm:inline">· Get credits</span>}
      {isLow && !isEmpty && <span className="hidden sm:inline">· Low</span>}
    </Link>
  );
}
