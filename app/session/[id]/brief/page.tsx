import type { Metadata } from "next";
import { BriefPanel } from "@/components/features/session/brief-panel";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Master Prompt",
};

interface BriefPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ url?: string; type?: string }>;
}

export default async function BriefPage({ params, searchParams }: BriefPageProps) {
  const { id } = await params;
  const { type = "auto" } = await searchParams;

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

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <BriefPanel
        sessionId={id}
        contentType={type}
        isLoggedIn={!!user}
        userPlan={plan}
      />
    </div>
  );
}
