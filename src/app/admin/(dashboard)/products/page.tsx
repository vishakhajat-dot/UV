import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/gst";
import ProductRowActions from "@/components/ProductRowActions";
import StatusBadge from "@/components/StatusBadge";

export const revalidate = 0;

export default async function AdminProductsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();
  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { hsnCode: { contains: q } },
          ],
        }
      : undefined,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Items</h1>
          <p className="text-sm text-slate-500">Everything you sell. The website catalogue and bills both use this list.</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">+ Add Item</Link>
      </div>

      <form className="mt-6 flex max-w-md gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, brand or HSN" className="input" />
        <button className="btn-secondary shrink-0 px-4 py-2">Search</button>
      </form>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Sell Price</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">GST</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-sky-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-brand-pale">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand-light">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-brand-navy/30">{p.brand.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-brand-navy">{p.name}</span>
                      <span className="block text-xs text-slate-500">
                        {p.brand}
                        {p.hsnCode && ` · HSN ${p.hsnCode}`}
                        {p.featured && " · Featured"}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.category.name}</td>
                <td className="px-4 py-3 text-right">{formatINR(p.price)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{p.costPrice ? formatINR(p.costPrice) : "-"}</td>
                <td className="px-4 py-3 text-right">{p.gstRate}%</td>
                <td className="px-4 py-3 text-right">
                  {p.stock <= 0 ? (
                    <StatusBadge status="OUT" />
                  ) : p.stock <= p.lowStockAt ? (
                    <span className="font-semibold text-amber-700">{p.stock} low</span>
                  ) : (
                    p.stock
                  )}
                </td>
                <td className="px-4 py-3"><ProductRowActions id={p.id} /></td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  {q ? "No items match that search." : "No items yet. Add your first item."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
