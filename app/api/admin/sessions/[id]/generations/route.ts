/**
 * app/api/admin/sessions/[id]/generations/route.ts
 * Returns the generation outputs for a specific session (for the admin to pick as "after" asset).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("sessions")
    .select("id, url, content_type, brief, fetched_content, is_public")
    .eq("id", id)
    .single();

  const { data: generations } = await admin
    .from("session_generations")
    .select("id, type, model, data, mime_type, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ session, generations: generations ?? [] });
}
