import type { Metadata } from "next";
import { BriefPanel } from "@/components/features/session/brief-panel";

export const metadata: Metadata = {
  title: "Creative Brief",
};

interface BriefPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ url?: string; type?: string }>;
}

export default async function BriefPage({ params, searchParams }: BriefPageProps) {
  const { id } = await params;
  const { type = "auto" } = await searchParams;

  return (
    <div className="flex flex-col flex-1">
      <BriefPanel sessionId={id} contentType={type} />
    </div>
  );
}
