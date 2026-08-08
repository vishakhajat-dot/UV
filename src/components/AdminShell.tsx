"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-brand-light dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-brand-navy text-white">
        <div className="container-page flex items-center justify-between py-3">
          <Link href="/admin" className="font-bold">
            Mahalaxmi Auto Agency &middot; Admin
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle className="!border-white/30 !text-white hover:!bg-white/10" />
            <Link href="/" target="_blank" className="text-sm text-gray-300 hover:text-white">
              View Site &rarr;
            </Link>
            <button onClick={handleLogout} className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              Logout
            </button>
          </div>
        </div>
        <nav className="container-page flex gap-1 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                pathname === item.href ? "bg-white text-brand-navy" : "text-gray-200 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
