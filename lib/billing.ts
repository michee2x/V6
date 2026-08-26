import { createAdminClient } from "@/utils/supabase/admin";

export const MODEL_CREDIT_COSTS: Record<string, number> = {
  "video": 150,    // ~$0.50 cost -> $1.50 retail
  "image": 40,     // $0.17 cost -> $0.40 retail
  "document": 5,   // ~$0.02 cost -> $0.05 retail
};

/**
 * Checks if user has enough credits and deducts them.
 * Throws an error if insufficient credits or user not found.
 */
export async function consumeCredits(userId: string, type: "video" | "image" | "document") {
  const supabase = createAdminClient();
  const cost = MODEL_CREDIT_COSTS[type];

  if (!cost) throw new Error("Invalid generation type");

  const { data: user, error } = await supabase
    .from("users")
    .select("id, credits_remaining, plan")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new Error("User not found or billing not initialized");
  }

  if (user.credits_remaining < cost) {
    throw new Error(`Insufficient credits. You need ${cost} credits for this action, but have ${user.credits_remaining}.`);
  }

  const newCredits = user.credits_remaining - cost;

  const { error: updateError } = await supabase
    .from("users")
    .update({ credits_remaining: newCredits })
    .eq("id", userId);

  if (updateError) {
    throw new Error("Failed to deduct credits");
  }

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    type: `generation_${type}`,
    amount: -cost,
    balance_after: newCredits,
    note: `Generated ${type}`,
  });

  return { newCredits, plan: user.plan };
}

export async function checkAnonymousUsage(fingerprint: string | undefined, ip: string | undefined) {
  if (!fingerprint && !ip) return true; // Fail safe if headers/cookies somehow completely missing

  const supabase = createAdminClient();
  const searchKey = fingerprint ? { key: 'fingerprint', val: fingerprint } : { key: 'ip_address', val: ip };
  
  let { data: usage } = await supabase
    .from("anonymous_usage")
    .select("*")
    .eq(searchKey.key, searchKey.val)
    .single();

  if (!usage) {
    const { data: newUsage, error } = await supabase
      .from("anonymous_usage")
      .insert({ fingerprint, ip_address: ip, runs_count: 1 })
      .select()
      .single();
    if (error) throw new Error("Failed to track anonymous usage");
    return true; // First run allowed
  }

  if (usage.runs_count >= 1) {
    throw new Error("Free trial limit reached. Please sign up to continue generating.");
  }

  await supabase
    .from("anonymous_usage")
    .update({ runs_count: usage.runs_count + 1, last_run_at: new Date().toISOString() })
    .eq("id", usage.id);

  return true;
}
