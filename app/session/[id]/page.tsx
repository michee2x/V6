import { SessionWorkspace } from "@/components/features/session/session-workspace";

interface SessionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ url?: string; type?: string }>;
}

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
  const { id } = await params;
  const { url = "", type = "auto" } = await searchParams;

  return <SessionWorkspace sessionId={id} initialUrl={url} contentType={type} />;
}
