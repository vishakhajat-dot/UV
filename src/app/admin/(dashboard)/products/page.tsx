import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductRowActions from "@/components/ProductRowActions";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-navy dark:text-white">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-light text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-brand-light dark:text-gray-200 dark:hover:bg-gray-800">
                <td className="px-4 py-3 font-medium text-brand-navy dark:text-white">{p.name}</td>
                <td className="px-4 py-3">{p.brand}</td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3">Rs {p.price.toFixed(2)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">{p.featured ? "Yes" : "-"}</td>
                <td className="px-4 py-3"><ProductRowActions id={p.id} /></td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No products yet. Add your first product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
