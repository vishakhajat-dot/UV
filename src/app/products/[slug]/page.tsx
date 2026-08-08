import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import AddToCartBox from "@/components/AddToCartBox";
import ProductCard from "@/components/ProductCard";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 0;

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    include: { category: true },
    take: 4,
  });

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/products" className="hover:text-brand-red">Products</Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand-red">
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-navy dark:text-white">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex h-80 items-center justify-center rounded-lg bg-brand-light dark:bg-gray-800">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded-lg object-cover" />
          ) : (
            <span className="text-6xl font-bold text-brand-navy/20 dark:text-white/20">{product.brand.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-red">{product.brand}</span>
          <h1 className="mt-1 text-2xl font-extrabold text-brand-navy sm:text-3xl dark:text-white">{product.name}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Category: {product.category.name}</p>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-brand-navy dark:text-white">Rs {product.price.toFixed(2)}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/ {product.unit}</span>
          </div>
          <p className="mt-1 text-sm font-medium">
            {product.stock > 0 ? (
              <span className="text-green-600 dark:text-green-400">In Stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
          </p>

          <p className="mt-5 leading-relaxed text-gray-700 dark:text-gray-300">{product.description}</p>

          <AddToCartBox
            productId={product.id}
            name={product.name}
            price={product.price}
            unit={product.unit}
            stock={product.stock}
            imageUrl={product.imageUrl}
          />

          <a
            href={whatsappLink(
              `Hello Mahalaxmi Auto Agency, I would like to enquire about "${product.name}" (Rs ${product.price.toFixed(
                2
              )}/${product.unit}).`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1ebe5b] hover:underline"
          >
            Ask about this product on WhatsApp &rarr;
          </a>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-brand-navy dark:text-white">Related Products</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
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
    </div>
  );
}
