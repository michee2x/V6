import { OutputPanel } from "@/components/features/session/output-panel";

export default async function OutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OutputPanel sessionId={id} />;
}
