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
  const { data: users, error } = await admin
    .from("users")
    .select("id, email, plan, credits_remaining, created_at, subscription_status")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ users });
}

export async function POST(req: Request) {
  const supabaseServer = await createClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user || !isAdmin(user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    // Create user in Auth
    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email,
      password: password || undefined,
      email_confirm: true, // auto confirm for admin created users
      user_metadata: { name }
    });

    if (createError) throw createError;

    // Create user in DB
    const { error: dbError } = await admin.from("users").insert({
      id: authData.user.id,
      email,
      plan: role === "admin" ? "pro" : "free",
      credits_remaining: role === "admin" ? 99999 : 500,
      credits_total: role === "admin" ? 99999 : 500,
    });

    if (dbError) throw dbError;

    return Response.json({ success: true, user: authData.user });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const supabaseServer = await createClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user || !isAdmin(user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const targetId = url.searchParams.get("id");

  if (!targetId) return Response.json({ error: "Missing ID" }, { status: 400 });

  const admin = createAdminClient();
  
  // Deleting from Auth usually cascades to the public.users table if set up that way,
  // but let's delete from auth which is the safest way to fully remove a user
  const { error } = await admin.auth.admin.deleteUser(targetId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
