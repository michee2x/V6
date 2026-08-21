"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function verifyEmailAction(token_hash: string, type: string) {
  if (!token_hash || !type) {
    redirect("/login?error=Verification token missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as any,
  });

  if (error) {
    redirect("/login?error=Invalid or expired verification link");
  }

  redirect(`/login?verified=true`);
}
