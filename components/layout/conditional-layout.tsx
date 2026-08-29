"use client";

import { usePathname } from "next/navigation";

export function ConditionalHeader({ children }: { children: React.ReactNode }) {
  // Always show header on all routes
  return <>{children}</>;
}

export function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide on session routes
  if (pathname?.startsWith("/session")) return null;
  return <>{children}</>;
}
