import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatINR, round2 } from "@/lib/gst";
import StatCard from "@/components/admin/StatCard";
import StockEntryForm from "@/components/admin/StockEntryForm";
import StatusBadge from "@/components/StatusBadge";

export const revalidate = 0;

const MOVE_LABEL: Record<string, string> = {
  PURCHASE: "Stock in",
  SALE: "Sold",
  SALE_CANCELLED: "Bill cancelled",
  ADJUSTMENT: "Adjustment",
};

export default async function StockPage({ searchParams }: { searchParams: { product?: string; show?: string } }) {
  const lowOnly = searchParams.show === "low";
  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, brand: true, unit: true, stock: true, costPrice: true, price: true, lowStockAt: true },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      where: searchParams.product ? { productId: searchParams.product } : undefined,
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const low = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt);
  const out = products.filter((p) => p.stock <= 0);
  const stockValue = round2(products.reduce((s, p) => s + Math.max(p.stock, 0) * p.costPrice, 0));
  const saleValue = round2(products.reduce((s, p) => s + Math.max(p.stock, 0) * p.price, 0));
  const shown = lowOnly ? products.filter((p) => p.stock <= p.lowStockAt) : products;
  const focus = products.find((p) => p.id === searchParams.product);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">Stock</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Stock Value (at cost)" value={formatINR(stockValue)} />
        <StatCard label="Stock Value (at selling price)" value={formatINR(saleValue)} />
        <StatCard label="Running Low" value={String(low.length)} tone={low.length ? "warn" : "default"} />
        <StatCard label="Out of Stock" value={String(out.length)} tone={out.length ? "bad" : "default"} />
      </div>

      <h2 className="mt-8 text-lg font-bold text-brand-navy">Add stock / correct stock</h2>
      <div className="mt-3">
        <StockEntryForm products={products} initialProductId={searchParams.product} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-navy">Stock levels</h2>
            <div className="flex gap-2 text-sm">
              <Link href="/admin/stock" className={`rounded-full px-3 py-1 ${!lowOnly ? "bg-brand-primary text-white" : "bg-brand-light text-brand-navy"}`}>All</Link>
              <Link href="/admin/stock?show=low" className={`rounded-full px-3 py-1 ${lowOnly ? "bg-brand-primary text-white" : "bg-brand-light text-brand-navy"}`}>Low &amp; out</Link>
            </div>
          </div>
          <div className="card mt-3 overflow-x-auto">
            <table className="tabular w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-2.5">Item</th>
                  <th className="px-4 py-2.5 text-right">In Stock</th>
                  <th className="px-4 py-2.5 text-right">Cost / unit</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {shown.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-pale">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/stock?product=${p.id}`} className="font-medium text-brand-navy hover:text-brand-primary">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {p.stock <= 0 ? (
                        <StatusBadge status="OUT" />
                      ) : p.stock <= p.lowStockAt ? (
                        <span className="font-semibold text-amber-700">{p.stock} {p.unit}</span>
                      ) : (
                        `${p.stock} ${p.unit}`
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{p.costPrice ? formatINR(p.costPrice) : "not set"}</td>
                    <td className="px-4 py-2.5 text-right">{formatINR(round2(Math.max(p.stock, 0) * p.costPrice))}</td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Nothing is running low.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-2">
          <h2 className="text-lg font-bold text-brand-navy">
            {focus ? `History: ${focus.name}` : "Recent stock movements"}
          </h2>
          {focus && (
            <Link href="/admin/stock" className="text-sm text-brand-primary hover:underline">Show all items</Link>
          )}
          <div className="card mt-3 divide-y divide-sky-50">
            {movements.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-brand-navy">{focus ? MOVE_LABEL[m.type] ?? m.type : m.product.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(m.createdAt)}
                    {!focus && ` · ${MOVE_LABEL[m.type] ?? m.type}`}
                    {m.note && ` · ${m.note}`}
                  </p>
                </div>
                <span className={`tabular shrink-0 font-semibold ${m.change > 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {m.change > 0 ? "+" : ""}
                  {m.change}
                </span>
              </div>
            ))}
            {movements.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">No stock movements yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
