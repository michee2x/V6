"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function verifyEmailAction(code: string, next: string = "/") {
  if (!code) {
    redirect("/login?error=Verification code missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect("/login?error=Invalid or expired verification link");
  }

  redirect(`/login?verified=true`);
}
