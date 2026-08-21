"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/login?error=Could not authenticate user");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const token = formData.get("captchaToken") as string;

  // Verify captcha token
  if (!token) {
    redirect("/login?error=Missing captcha token");
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const verifyResponse = await fetch(`${origin}/api/recaptcha`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const verifyResult = await verifyResponse.json();
  
  if (!verifyResponse.ok || !verifyResult.success) {
    redirect("/login?error=Invalid captcha verification");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?type=signup`,
    },
  });

  if (error) {
    redirect("/login?error=Could not sign up user");
  }

  revalidatePath("/", "layout");
  redirect("/login?message=Check your email to verify your account");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
