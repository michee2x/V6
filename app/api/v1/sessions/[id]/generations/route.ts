/**
 * app/api/v1/sessions/[id]/generations/route.ts
 * GET — Retrieve all non-expired generations for a session
 */

import { NextRequest, NextResponse } from "next/server";
import { getGenerations } from "@/lib/session-store";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing session ID" }, { status: 400 });
    }

    const generations = await getGenerations(id);
    
    // Filter out expired ones just in case pg_cron hasn't run yet
    const now = new Date();
    const validGenerations = generations.filter(gen => !gen.expiresAt || gen.expiresAt > now);

    return NextResponse.json({
      success: true,
      data: { generations: validGenerations },
    });
  } catch (err) {
    console.error("[GET /sessions/[id]/generations] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch generations" },
      { status: 500 }
    );
  }
}
