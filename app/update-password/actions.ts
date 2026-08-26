"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const supabase = await createClient();

  if (password !== confirmPassword) {
    redirect("/update-password?error=Passwords do not match");
  }

  if (password.length < 6) {
    redirect("/update-password?error=Password must be at least 6 characters");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?passwordUpdated=true");
}
