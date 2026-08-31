import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseServer = await createClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user || !isAdmin(user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  try {
    // Fetch counts in parallel
    const [
      { count: usersCount },
      { count: sessionsCount },
      { count: generationsCount },
      { count: activeSubscribers },
      { data: plansData }
    ] = await Promise.all([
      admin.from("users").select("id", { count: "exact", head: true }),
      admin.from("sessions").select("id", { count: "exact", head: true }),
      admin.from("session_generations").select("id", { count: "exact", head: true }),
      admin.from("users").select("id", { count: "exact", head: true }).eq("subscription_status", "active"),
      admin.from("users").select("plan").eq("subscription_status", "active")
    ]);

    // Estimate Revenue based on active plans
    // Using standard pricing structure (adjust as needed if Paddle prices change)
    const PLAN_PRICES: Record<string, number> = {
      starter: 19,
      growth: 49,
      pro: 99
    };
    
    let estimatedRevenue = 0;
    if (plansData) {
      estimatedRevenue = plansData.reduce((sum, userPlan) => {
        return sum + (PLAN_PRICES[userPlan.plan] || 0);
      }, 0);
    }

    return Response.json({
      users: usersCount || 0,
      activeSubscribers: activeSubscribers || 0,
      sessions: sessionsCount || 0,
      generations: generationsCount || 0,
      revenue: estimatedRevenue
    });
  } catch (error: any) {
    console.error("Failed to fetch admin stats:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
