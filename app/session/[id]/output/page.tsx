import { OutputPanel } from "@/components/features/session/output-panel";
import { createClient } from "@/utils/supabase/server";

export default async function OutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let plan = "free";
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .single();
    plan = data?.plan ?? "free";
  }

  return <OutputPanel sessionId={id} userPlan={plan} />;
}
