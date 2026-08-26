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
    redirect(`/login?error=${encodeURIComponent(error.message || "Could not authenticate user")}`);
  }

  const nextPath = (formData.get("next") as string) || "/";

  revalidatePath(nextPath, "layout");
  redirect(nextPath);
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

  const isLocalhost = process.env.NODE_ENV === 'development';
  const secret = isLocalhost
    ? process.env.RECAPTCHA_SECRET_KEY_LOCALHOST ?? process.env.RECAPTCHA_SECRET_KEY
    : process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    redirect("/login?error=reCAPTCHA secret is not configured");
  }

  const verifyFormData = new URLSearchParams({
    secret,
    response: token,
  });

  const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: verifyFormData.toString(),
  }).catch(() => {
    redirect("/login?error=Network error during captcha verification");
  });

  if (!verifyResponse || !verifyResponse.ok) {
    redirect("/login?error=Failed to verify captcha with Google");
  }

  const result = await verifyResponse.json().catch(() => ({ success: false }));

  if (!result.success) {
    redirect("/login?error=Invalid captcha verification");
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?type=signup`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message || "Could not sign up user")}`);
  }

  if (data?.user?.identities && data.user.identities.length === 0) {
    redirect("/login?error=This email is already registered. Please sign in.");
  }

  revalidatePath("/", "layout");
  redirect("/login?newsignup=true");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
