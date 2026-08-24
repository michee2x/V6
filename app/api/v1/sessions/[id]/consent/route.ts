import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify session belongs to user or is anonymous
    const { data: session, error: getError } = await supabase
      .from("sessions")
      .select("id, user_id")
      .eq("id", sessionId)
      .single();

    if (getError || !session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    // Set showcase_consent to true
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ showcase_consent: true })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to update showcase consent:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to save consent" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Consent PATCH error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
