import Link from "next/link";
import { prisma } from "@/lib/db";
import { paymentStatus } from "@/lib/billing";
import { dayEnd, dayStart, formatDate, monthStartYmd, todayYmd } from "@/lib/dates";
import { formatINR, round2 } from "@/lib/gst";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/admin/StatCard";

export const revalidate = 0;

export default async function AdminDashboard() {
  const today = todayYmd();
  const monthRange = { gte: dayStart(monthStartYmd()), lte: dayEnd(today) };
  const todayRange = { gte: dayStart(today), lte: dayEnd(today) };

  const [monthBills, todayBills, unpaid, products, pendingOrders, recentBills, monthExpenses, vendorBills] = await Promise.all([
    prisma.invoice.findMany({
      where: { invoiceDate: monthRange, status: { not: "CANCELLED" } },
      select: { total: true, taxableTotal: true, costTotal: true },
    }),
    prisma.invoice.findMany({ where: { invoiceDate: todayRange, status: { not: "CANCELLED" } }, select: { total: true } }),
    prisma.invoice.findMany({ where: { status: { not: "CANCELLED" } }, select: { total: true, amountPaid: true } }),
    prisma.product.findMany({ select: { id: true, name: true, stock: true, lowStockAt: true, unit: true }, orderBy: { stock: "asc" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.expense.aggregate({ where: { date: monthRange }, _sum: { amount: true } }),
    prisma.purchaseBill.findMany({ select: { total: true, amountPaid: true } }),
  ]);
  const owedToVendors = round2(vendorBills.reduce((s, b) => s + Math.max(b.total - b.amountPaid, 0), 0));

  const monthSales = round2(monthBills.reduce((s, b) => s + b.total, 0));
  const monthProfit = round2(
    monthBills.reduce((s, b) => s + b.taxableTotal - b.costTotal, 0) - (monthExpenses._sum.amount ?? 0)
  );
  const todaySales = round2(todayBills.reduce((s, b) => s + b.total, 0));
  const receivable = round2(unpaid.reduce((s, b) => s + Math.max(b.total - b.amountPaid, 0), 0));
  const lowStock = products.filter((p) => p.stock <= p.lowStockAt);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Dashboard</h1>
          <p className="text-sm text-slate-500">{formatDate(new Date())}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/billing/new" className="btn-primary">+ New Bill</Link>
          <Link href="/admin/purchases/new" className="btn-secondary">+ New Purchase</Link>
          <Link href="/admin/products/new" className="btn-secondary">+ Add Item</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Sales" value={formatINR(todaySales)} sub={`${todayBills.length} bills`} />
        <StatCard label="This Month's Sales" value={formatINR(monthSales)} sub={`${monthBills.length} bills`} />
        <StatCard label="Net Profit This Month" value={formatINR(monthProfit)} tone={monthProfit >= 0 ? "good" : "bad"} sub="after expenses" />
        <StatCard label="To Collect" value={formatINR(receivable)} tone={receivable > 0.5 ? "warn" : "default"} sub="unpaid bill balances" />
      </div>

      {owedToVendors > 0.5 && (
        <Link
          href="/admin/purchases?status=due"
          className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          <span>You owe vendors {formatINR(owedToVendors)}</span>
          <span>View due bills &rarr;</span>
        </Link>
      )}

      {pendingOrders > 0 && (
        <Link
          href="/admin/orders"
          className="mt-4 flex items-center justify-between rounded-xl border border-sky-200 bg-brand-light px-4 py-3 text-sm font-medium text-brand-navy hover:bg-sky-100"
        >
          <span>{pendingOrders} new website order{pendingOrders > 1 ? "s" : ""} waiting</span>
          <span className="text-brand-primary">Open &rarr;</span>
        </Link>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-navy">Recent Bills</h2>
            <Link href="/admin/billing" className="text-sm font-semibold text-brand-primary hover:underline">View all &rarr;</Link>
          </div>
          <div className="card mt-3 overflow-x-auto">
            <table className="tabular w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-2.5">Bill No.</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {recentBills.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-pale">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/billing/${b.id}`} className="font-medium text-brand-primary hover:underline">{b.invoiceNumber}</Link>
                    </td>
                    <td className="px-4 py-2.5">{b.billBusiness || b.billName}</td>
                    <td className="px-4 py-2.5 text-right">{formatINR(b.total)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={paymentStatus(b)} /></td>
                  </tr>
                ))}
                {recentBills.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No bills yet. <Link href="/admin/billing/new" className="text-brand-primary hover:underline">Make your first bill</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-navy">Low Stock</h2>
            <Link href="/admin/stock?show=low" className="text-sm font-semibold text-brand-primary hover:underline">Manage &rarr;</Link>
          </div>
          <div className="card mt-3 divide-y divide-sky-50">
            {lowStock.slice(0, 8).map((p) => (
              <Link key={p.id} href={`/admin/stock?product=${p.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-brand-pale">
                <span className="font-medium text-brand-navy">{p.name}</span>
                {p.stock <= 0 ? <StatusBadge status="OUT" /> : <span className="font-semibold text-amber-700">{p.stock} {p.unit}</span>}
              </Link>
            ))}
            {lowStock.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">All items are well stocked.</p>}
            {lowStock.length > 8 && (
              <p className="px-4 py-2.5 text-center text-xs text-slate-500">and {lowStock.length - 8} more</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
