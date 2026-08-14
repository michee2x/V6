import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Session } from "@/lib/session-store";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching history:", error);
    return <div>Error loading history</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Your History</h1>

      {(!sessions || sessions.length === 0) ? (
        <p className="text-muted-foreground">You haven't generated any briefs yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/session/${session.id}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {session.content_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(session.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <h3 className="text-sm font-medium line-clamp-2">
                {session.url.replace("upload://", "")}
              </h3>
              <p className="text-xs text-muted-foreground mt-auto">
                {session.brief ? "Brief Complete" : session.advanced_insight ? "Advanced Insight" : session.basic_insight ? "Basic Insight" : "Analyzing..."}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
