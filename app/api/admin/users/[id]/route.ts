import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabaseServer = await createClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user || !isAdmin(user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  try {
    const { data: targetUser, error } = await admin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !targetUser) throw error;

    // Get stats for this user
    const [
      { count: sessionsCount },
      { count: generationsCount }
    ] = await Promise.all([
      admin.from("sessions").select("id", { count: "exact", head: true }).eq("user_id", id),
      admin.from("session_generations").select("id", { count: "exact", head: true }).eq("user_id", id),
    ]);

    return Response.json({
      user: {
        ...targetUser,
        sessions_count: sessionsCount || 0,
        generations_count: generationsCount || 0,
      }
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabaseServer = await createClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user || !isAdmin(user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  try {
    const body = await req.json();
    const { name, plan, credits_total } = body;

    const { error: dbError } = await admin
      .from("users")
      .update({
        name,
        plan,
        credits_total,
      })
      .eq("id", id);

    if (dbError) throw dbError;

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
