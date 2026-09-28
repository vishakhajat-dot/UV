"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SiteLogo from "./SiteLogo";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/billing", label: "Bills" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/products", label: "Items" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/expenses", label: "Expenses" },
  { href: "/admin/reports", label: "Profit & Loss" },
  { href: "/admin/orders", label: "Web Orders" },
  { href: "/admin/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-brand-pale">
      <header className="no-print sticky top-0 z-30 border-b border-sky-100 bg-white/95 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-2.5">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <SiteLogo className="h-10" />
            <span className="min-w-0">
              <span className="block truncate font-bold leading-tight text-brand-navy">Mahalaxmi Auto Agency</span>
              <span className="block text-xs font-medium text-brand-primary">Admin &amp; Billing</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/admin/billing/new" className="btn-primary px-3 py-2 sm:px-4">
              + New Bill
            </Link>
            <Link href="/" target="_blank" className="hidden text-sm text-slate-500 hover:text-brand-primary sm:inline">
              View Site &rarr;
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-md border border-sky-200 px-3 py-2 text-sm font-medium text-brand-navy hover:bg-brand-light"
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="container-page -mb-px flex gap-1 overflow-x-auto pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                isActive(pathname, item.href)
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-brand-light hover:text-brand-navy"
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
