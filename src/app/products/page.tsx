import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Products | Mahalaxmi Auto Agency",
  description: "Browse auto electrical parts and accessories from Mahalaxmi Auto Agency, Pune.",
};

export const revalidate = 0;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; group?: string; q?: string };
}) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const activeCategory = searchParams.category;
  const activeGroup = searchParams.group;
  const q = searchParams.q?.trim();

  const groupedCategories = categories.reduce<Record<string, typeof categories>>((acc, c) => {
    (acc[c.group] ||= []).push(c);
    return acc;
  }, {});

  const products = await prisma.product.findMany({
    where: {
      ...(activeCategory ? { category: { slug: activeCategory } } : {}),
      ...(activeGroup ? { category: { group: activeGroup } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { brand: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container-page py-10">
      <div className="text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">Catalog</span>
        <h1 className="mt-2 text-3xl font-extrabold text-brand-navy dark:text-white">Our Products</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Genuine electrical parts &amp; accessories for workshops, retailers and dealers.
        </p>
      </div>

      <form className="mx-auto mt-8 flex max-w-md gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search products or brands..."
          className="input"
        />
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        {activeGroup && <input type="hidden" name="group" value={activeGroup} />}
        <button type="submit" className="btn-primary shrink-0">Search</button>
      </form>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link
          href="/products"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            !activeCategory && !activeGroup
              ? "bg-brand-navy text-white"
              : "bg-brand-light text-brand-navy hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          All
        </Link>
        {Object.keys(groupedCategories).map((g) => (
          <Link
            key={g}
            href={`/products?group=${encodeURIComponent(g)}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              activeGroup === g && !activeCategory
                ? "bg-brand-red text-white"
                : "bg-brand-gold/20 text-brand-navy hover:bg-brand-gold/30 dark:text-brand-gold"
            }`}
          >
            {g}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeCategory === c.slug
                ? "bg-brand-navy text-white"
                : "bg-brand-light text-brand-navy hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-gray-500 dark:text-gray-400">
          No products found. Try a different search or category.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
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
      )}
    </div>
  );
}
