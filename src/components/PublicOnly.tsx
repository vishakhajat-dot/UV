"use client";

import { usePathname } from "next/navigation";

// Storefront chrome (header, footer, WhatsApp button) is hidden inside the admin panel,
// which has its own shell.
export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
