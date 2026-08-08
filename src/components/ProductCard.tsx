"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string | null;
  category: { name: string; slug: string };
};

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();

  return (
    <div className="card flex flex-col overflow-hidden transition hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="flex h-40 items-center justify-center bg-brand-light dark:bg-gray-800">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-brand-navy/20 dark:text-white/20">{product.brand.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-red">{product.brand}</span>
        <Link href={`/products/${product.slug}`} className="font-semibold text-brand-navy hover:underline dark:text-white">
          {product.name}
        </Link>
        <span className="text-xs text-gray-500 dark:text-gray-400">{product.category.name}</span>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-navy dark:text-white">
            Rs {product.price.toFixed(2)}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/{product.unit}</span>
          </span>
          {product.stock > 0 ? (
            <span className="text-xs font-medium text-green-600">In Stock</span>
          ) : (
            <span className="text-xs font-medium text-red-500">Out of Stock</span>
          )}
        </div>
        <button
          disabled={product.stock <= 0}
          onClick={() =>
            addItem({
              productId: product.id,
              name: product.name,
              price: product.price,
              unit: product.unit,
              imageUrl: product.imageUrl,
            })
          }
          className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
