import { createAdminClient } from "@/utils/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabaseServer = await createClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user || !isAdmin(user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Generate a magic link to get the token
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
    });

    if (error) {
      console.error("Error generating link:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Return the raw token for the frontend to verify directly, logging in as the user
    if (data && data.properties && data.properties.hashed_token) {
      return Response.json({ token: data.properties.hashed_token });
    } else {
      return Response.json({ error: "Failed to generate token" }, { status: 500 });
    }
  } catch (e: any) {
    console.error("Error in login-link route:", e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
