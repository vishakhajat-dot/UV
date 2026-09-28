import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { SITE, whatsappLink } from "@/lib/whatsapp";

const BRANDS = [
  { name: "Radhe Bulbs", slug: "radhe-bulbs" },
  { name: "Vasko Bulbs", slug: "vasko-bulbs" },
  { name: "KSV Bulbs", slug: "ksv-bulbs" },
  { name: "Canon Wires", slug: "canon-wires" },
  { name: "Sunny Switches", slug: "sunny-switches" },
];

const CATEGORY_GROUPS = [
  { name: "Electrical Parts", desc: "Tail lamps, indicators, bulb holders & mirror switches" },
  { name: "Wiring Solutions", desc: "Canon wires, battery terminals, wires & lugs" },
  { name: "Bulbs & Switches", desc: "Radhe, Vasko, KSV bulbs & Sunny switches" },
  { name: "Cooling Solutions", desc: "Automotive coolants & AdBlue solutions" },
  { name: "Additional Essentials", desc: "Wiring clips, wiper blades & KKK fans" },
];

const WHY_US = [
  { title: "25+ Years of Trust", desc: "Serving Pune's automotive market reliably since 1996." },
  { title: "Authorized Distributor", desc: "Genuine products from Radhe, Vasko, KSV, Canon and Sunny." },
  { title: "Competitive Pricing", desc: "Fair, dealer-friendly pricing for workshops and retailers." },
  { title: "Fast Ordering", desc: "Browse, order online and confirm instantly on WhatsApp." },
];

export const revalidate = 0;

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { featured: true },
    include: { category: true },
    take: 8,
  });

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-light via-white to-sky-100 text-brand-navy">
        <div className="container-page grid gap-8 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="inline-block rounded-full bg-white px-3 shadow-sm ring-1 ring-sky-100 py-1 text-xs font-semibold text-brand-primary">
              Since 1996 &middot; Guruwar Peth, Pune
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
              Trusted Auto Parts &amp; Accessories Supplier in Pune
            </h1>
            <p className="mt-4 max-w-xl text-slate-600">
              For more than 25 years, {SITE.name} has supplied premium electrical components and
              accessories to workshops, retailers, and spare parts dealers across Pune.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">Browse Products</Link>
              <a
                href={whatsappLink("Hello Mahalaxmi Auto Agency, I would like to enquire about your products.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
          <div className="justify-self-center md:justify-self-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Mahalaxmi Auto Agency logo"
              className="w-full max-w-md rounded-2xl shadow-xl shadow-sky-200/70 ring-1 ring-sky-100"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="text-center text-2xl font-bold text-brand-navy dark:text-white">Why Choose Us</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((item) => (
            <div key={item.title} className="card p-5">
              <h3 className="font-semibold text-brand-navy dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-light py-14 dark:bg-gray-900">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold text-brand-navy dark:text-white">Shop by Category</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-gray-600 dark:text-gray-400">
            Everything organized the way our workshops and dealers actually shop.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORY_GROUPS.map((g) => (
              <Link
                key={g.name}
                href={`/products?group=${encodeURIComponent(g.name)}`}
                className="card flex flex-col gap-1 p-5 text-center transition hover:border-brand-primary"
              >
                <span className="font-semibold text-brand-navy dark:text-white">{g.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{g.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold text-brand-navy dark:text-white">Our Authorized Brands</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-gray-600 dark:text-gray-400">
            We are proud authorized distributors of brands trusted across the automotive industry for
            durability, reliability, and performance.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {BRANDS.map((b) => (
              <Link
                key={b.slug}
                href={`/products?category=${b.slug}`}
                className="card flex items-center justify-center px-4 py-6 text-center text-sm font-semibold text-brand-navy transition hover:border-brand-primary hover:text-brand-primary dark:text-white dark:hover:text-brand-primary"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-page py-14">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-brand-navy dark:text-white">Featured Products</h2>
            <Link href="/products" className="text-sm font-semibold text-brand-primary hover:underline">
              View all &rarr;
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  brand: p.brand,
                  price: p.price,
                  unit: p.unit,
                  stock: p.stock,
                  imageUrl: p.imageUrl,
                  category: { name: p.category.name, slug: p.category.slug },
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="bg-brand-primary py-14 text-white">
        <div className="container-page flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-bold">Need Bulk Pricing or a Custom Quote?</h2>
          <p className="max-w-xl text-sky-50">
            Workshops, retailers and spare parts dealers can connect with us directly for bulk orders
            and dealer pricing.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-secondary bg-white">Contact Us</Link>
            <a
              href={whatsappLink("Hello Mahalaxmi Auto Agency, I would like bulk/dealer pricing information.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              Get Quote on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
