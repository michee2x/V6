import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name: bodyName, email: bodyEmail, message, type } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is logged in — if so, pull name/email from their profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let name = bodyName;
    let email = bodyEmail;

    if (user) {
      // Logged-in: use their auth email and metadata display name
      email = user.email ?? email;
      name =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        name ??
        "Unknown";
    }

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Insert into contact_messages table
    const { error } = await supabase
      .from("contact_messages")
      .insert([
        {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          // store the inquiry type if the table supports it; gracefully ignored if not
          ...(type ? { type: type.trim() } : {}),
        },
      ]);

    if (error) {
      console.error("Contact form error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save message. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Contact POST error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
