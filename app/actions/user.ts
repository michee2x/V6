"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Marks the welcome modal as seen for the currently authenticated user.
 * This is called client-side once the user dismisses the modal.
 */
export async function markWelcomeModalSeen(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("users")
    .update({ has_seen_welcome_modal: true })
    .eq("id", user.id);
}

/**
 * Returns whether the current user should see the welcome modal.
 * Returns null if the user is not authenticated.
 */
export async function getWelcomeModalStatus(): Promise<{
  shouldShow: boolean;
  credits: number;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("has_seen_welcome_modal, credits_remaining")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  return {
    shouldShow: !data.has_seen_welcome_modal,
    credits: data.credits_remaining ?? 30,
  };
}
