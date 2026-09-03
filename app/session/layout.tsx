import type { Metadata } from "next";
import { SessionNav } from "@/components/features/session/session-nav";

export const metadata: Metadata = {
  title: "Session",
};

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SessionNav />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">{children}</div>
    </div>
  );
}
