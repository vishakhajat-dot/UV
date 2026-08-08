import type { Metadata } from "next";
import Link from "next/link";
import { SITE, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "About Us | Mahalaxmi Auto Agency",
  description: "Learn about Mahalaxmi Auto Agency, Pune's trusted auto parts supplier since 1996.",
};

const BRANDS = ["Radhe Bulbs", "Vasko Bulbs", "KSV Bulbs", "Canon Wires", "Sunny Switches"];

export default function AboutPage() {
  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-3xl">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">About Us</span>
        <h1 className="mt-2 text-3xl font-extrabold text-brand-navy sm:text-4xl dark:text-white">
          Mahalaxmi Auto Agency
        </h1>
        <p className="mt-2 text-lg font-medium text-gray-600 dark:text-gray-400">
          Trusted Auto Parts &amp; Accessories Supplier in Pune since 1996
        </p>

        <div className="mt-8 space-y-5 leading-relaxed text-gray-700 dark:text-gray-300">
          <p>
            {SITE.name} has been serving the automotive market for more than 25 years, supplying
            premium electrical components and accessories to workshops, retailers, and spare parts
            dealers across Pune.
          </p>
          <p>
            Located in Guruwar Peth, Pune, we specialize in providing dependable automotive products
            built for durability and everyday reliability. Our mission is to deliver quality products,
            competitive pricing, and excellent service to support the growing needs of the automotive
            industry.
          </p>
        </div>

        <div className="mt-10 rounded-lg border border-gray-200 bg-brand-light p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-xl font-bold text-brand-navy dark:text-white">Authorized Distributors</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We are proud authorized distributors of brands trusted across the automotive industry for
            durability, reliability, and performance:
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {BRANDS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-brand-navy dark:text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                <span className="font-medium">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/products" className="btn-primary">Browse Our Products</Link>
          <a
            href={whatsappLink("Hello Mahalaxmi Auto Agency, I would like to know more about your company.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
