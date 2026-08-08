"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { SITE, telLink } from "@/lib/whatsapp";
import ThemeToggle from "./ThemeToggle";
import SiteLogo from "./SiteLogo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="bg-brand-navy text-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
          <span>Trusted Auto Parts &amp; Accessories Supplier in Pune since 1996</span>
          <div className="flex items-center gap-4">
            <a href={telLink(SITE.phonePrimary)} className="hover:text-brand-gold">
              Call: {SITE.phonePrimary}
            </a>
            <span className="hidden sm:inline">|</span>
            <a href={`mailto:${SITE.email}`} className="hidden hover:text-brand-gold sm:inline">
              {SITE.email}
            </a>
          </div>
        </div>
      </div>
      <div className="container-page flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo />
          <span>
            <span className="block text-lg font-bold leading-tight text-brand-navy dark:text-white">
              Mahalaxmi Auto Agency
            </span>
            <span className="block text-xs font-medium text-brand-red">Since 1996 &middot; Pune</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition hover:text-brand-red ${
                pathname === link.href ? "text-brand-red" : "text-brand-navy dark:text-gray-200"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 rounded-md border border-brand-navy px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-light dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            className="text-brand-navy dark:text-gray-100 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 md:hidden">
          <div className="container-page flex flex-col gap-1 py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded px-2 py-2 text-sm font-medium text-brand-navy hover:bg-brand-light dark:text-gray-100 dark:hover:bg-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
