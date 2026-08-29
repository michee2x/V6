/**
 * app/api/admin/sessions/route.ts
 * Returns paginated sessions list for the admin panel session picker.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
  const search = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type") ?? "";
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from("sessions")
    .select("id, url, content_type, brief, is_public, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike("url", `%${search}%`);
  if (type && type !== "all") query = query.eq("content_type", type);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count ?? 0, page, limit });
}
