import { updateSession } from "@/utils/supabase/middleware";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = await updateSession(request);
  
  // Set a visitor fingerprint cookie if it doesn't exist
  if (!request.cookies.has("visitor_fingerprint")) {
    const fingerprint = crypto.randomUUID();
    response.cookies.set("visitor_fingerprint", fingerprint, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
