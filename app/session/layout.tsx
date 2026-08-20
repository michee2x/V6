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
    <div className="min-h-screen flex flex-col bg-background">
      <SessionNav />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
