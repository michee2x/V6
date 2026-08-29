"use client";

import { usePathname } from "next/navigation";

export function ConditionalHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide on admin routes (admin has its own sidebar)
  if (pathname?.startsWith("/admin")) return null;
  // Always show on all other routes
  return <>{children}</>;
}

export function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide on session and admin routes
  if (pathname?.startsWith("/session")) return null;
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
