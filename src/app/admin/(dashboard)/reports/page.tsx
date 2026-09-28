import { prisma } from "@/lib/db";
import { rangeFromParams, formatDate } from "@/lib/dates";
import { formatINR, round2 } from "@/lib/gst";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import StatCard from "@/components/admin/StatCard";

export const revalidate = 0;

export default async function ReportsPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const range = rangeFromParams(searchParams);
  const dateFilter = { gte: range.gte, lte: range.lte };

  const [invoices, expenses, purchases, purchaseBills] = await Promise.all([
    prisma.invoice.findMany({
      where: { invoiceDate: dateFilter, status: { not: "CANCELLED" } },
      include: { items: true },
    }),
    prisma.expense.findMany({ where: { date: dateFilter } }),
    prisma.stockMovement.findMany({ where: { type: "PURCHASE", createdAt: dateFilter }, select: { change: true, unitCost: true } }),
    prisma.purchaseBill.findMany({
      where: { billDate: dateFilter },
      select: { total: true, amountPaid: true, cgst: true, sgst: true, igst: true },
    }),
  ]);

  const sales = round2(invoices.reduce((s, i) => s + i.taxableTotal, 0));
  const cogs = round2(invoices.reduce((s, i) => s + i.costTotal, 0));
  const gross = round2(sales - cogs);
  const expenseTotal = round2(expenses.reduce((s, e) => s + e.amount, 0));
  const net = round2(gross - expenseTotal);
  const cgst = round2(invoices.reduce((s, i) => s + i.cgst, 0));
  const sgst = round2(invoices.reduce((s, i) => s + i.sgst, 0));
  const igst = round2(invoices.reduce((s, i) => s + i.igst, 0));
  const billed = round2(invoices.reduce((s, i) => s + i.total, 0));
  const received = round2(invoices.reduce((s, i) => s + i.amountPaid, 0));
  const purchaseBillTotal = round2(purchaseBills.reduce((s, p) => s + p.total, 0));
  const purchaseBillDue = round2(purchaseBills.reduce((s, p) => s + p.total - p.amountPaid, 0));
  const inputGst = round2(purchaseBills.reduce((s, p) => s + p.cgst + p.sgst + p.igst, 0));
  const outputGst = round2(cgst + sgst + igst);
  const purchased = round2(purchases.reduce((s, p) => s + p.change * (p.unitCost ?? 0), 0));

  const b2b = invoices.filter((i) => i.billGstin);
  const b2c = invoices.filter((i) => !i.billGstin);
  const sumTaxable = (list: typeof invoices) => round2(list.reduce((s, i) => s + i.taxableTotal, 0));
  const sumTax = (list: typeof invoices) => round2(list.reduce((s, i) => s + i.cgst + i.sgst + i.igst, 0));

  // Item-wise profit
  const itemMap = new Map<string, { name: string; qty: number; sales: number; cost: number; noCost: boolean }>();
  for (const inv of invoices) {
    for (const it of inv.items) {
      const key = it.productId ?? `custom:${it.name}`;
      const row = itemMap.get(key) ?? { name: it.name, qty: 0, sales: 0, cost: 0, noCost: false };
      row.qty += it.quantity;
      row.sales += it.taxableValue;
      row.cost += it.unitCost * it.quantity;
      if (!it.unitCost) row.noCost = true;
      itemMap.set(key, row);
    }
  }
  const items = Array.from(itemMap.values())
    .map((r) => ({ ...r, sales: round2(r.sales), cost: round2(r.cost), profit: round2(r.sales - r.cost) }))
    .sort((a, b) => b.profit - a.profit);
  const missingCost = items.filter((i) => i.noCost).length;

  const expenseByCat = Array.from(
    expenses.reduce((m, e) => m.set(e.category, (m.get(e.category) ?? 0) + e.amount), new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">Profit &amp; Loss</h1>
      <p className="text-sm text-slate-500">
        {formatDate(range.gte)} to {formatDate(range.lte)} · {invoices.length} bills
      </p>

      <div className="card mt-6 p-4">
        <DateRangeFilter from={range.from} to={range.to} basePath="/admin/reports" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales (before GST)" value={formatINR(sales)} sub={`${formatINR(billed)} billed incl. GST`} />
        <StatCard label="Gross Profit" value={formatINR(gross)} sub={sales ? `${round2((gross / sales) * 100)}% margin` : undefined} tone={gross >= 0 ? "good" : "bad"} />
        <StatCard label="Expenses" value={formatINR(expenseTotal)} />
        <StatCard label="Net Profit" value={formatINR(net)} tone={net >= 0 ? "good" : "bad"} />
      </div>

      {missingCost > 0 && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          {missingCost} item{missingCost > 1 ? "s were" : " was"} sold without a cost price, so profit is shown higher than it really is.
          Set cost prices on the Items page or when adding stock.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold text-brand-navy">Statement</h2>
          <dl className="tabular mt-3 space-y-2 text-sm">
            <Line label="Sales (taxable value)" value={formatINR(sales)} />
            <Line label="Less: cost of goods sold" value={`- ${formatINR(cogs)}`} />
            <Line label="Gross profit" value={formatINR(gross)} strong />
            {expenseByCat.map(([cat, amt]) => (
              <Line key={cat} label={`Less: ${cat}`} value={`- ${formatINR(round2(amt))}`} muted />
            ))}
            <div className={`flex justify-between rounded-lg px-3 py-2.5 text-base font-bold text-white ${net >= 0 ? "bg-emerald-600" : "bg-red-600"}`}>
              <dt>Net {net >= 0 ? "profit" : "loss"}</dt>
              <dd>{formatINR(Math.abs(net))}</dd>
            </div>
          </dl>
          <dl className="tabular mt-5 space-y-2 border-t border-sky-100 pt-4 text-sm">
            <Line label="Amount received on these bills" value={formatINR(received)} muted />
            <Line label="Still to collect" value={formatINR(round2(billed - received))} muted />
            <Line label="Stock bought in this period (at cost)" value={formatINR(purchased)} muted />
            <Line label={`Purchase bills (${purchaseBills.length})`} value={formatINR(purchaseBillTotal)} muted />
            <Line label="Still to pay vendors on these" value={formatINR(purchaseBillDue)} muted />
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-brand-navy">GST summary</h2>
          <p className="text-xs text-slate-500">GST is not counted as income or cost above. Input credit only counts for purchase bills from GST-registered vendors.</p>
          <dl className="tabular mt-3 space-y-2 text-sm">
            <Line label="CGST collected" value={formatINR(cgst)} />
            <Line label="SGST collected" value={formatINR(sgst)} />
            <Line label="IGST collected" value={formatINR(igst)} />
            <Line label="Total GST collected (output)" value={formatINR(outputGst)} strong />
            <Line label="Less: GST paid on purchases (input credit)" value={`- ${formatINR(inputGst)}`} />
            <Line label={outputGst - inputGst >= 0 ? "Net GST payable" : "Extra input credit carried forward"} value={formatINR(Math.abs(round2(outputGst - inputGst)))} strong />
          </dl>
          <table className="tabular mt-5 w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Bills</th>
                <th className="px-3 py-2 text-right">Taxable</th>
                <th className="px-3 py-2 text-right">GST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              <tr>
                <td className="px-3 py-2">B2B (customer has GSTIN)</td>
                <td className="px-3 py-2 text-right">{b2b.length}</td>
                <td className="px-3 py-2 text-right">{formatINR(sumTaxable(b2b))}</td>
                <td className="px-3 py-2 text-right">{formatINR(sumTax(b2b))}</td>
              </tr>
              <tr>
                <td className="px-3 py-2">B2C (no GSTIN)</td>
                <td className="px-3 py-2 text-right">{b2c.length}</td>
                <td className="px-3 py-2 text-right">{formatINR(sumTaxable(b2c))}</td>
                <td className="px-3 py-2 text-right">{formatINR(sumTax(b2c))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold text-brand-navy">Profit by item</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="tabular w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-2.5">Item</th>
              <th className="px-4 py-2.5 text-right">Qty Sold</th>
              <th className="px-4 py-2.5 text-right">Sales</th>
              <th className="px-4 py-2.5 text-right">Cost</th>
              <th className="px-4 py-2.5 text-right">Profit</th>
              <th className="px-4 py-2.5 text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-50">
            {items.map((r, idx) => (
              <tr key={`${r.name}-${idx}`}>
                <td className="px-4 py-2.5 font-medium text-brand-navy">
                  {r.name}
                  {r.noCost && <span className="ml-2 text-xs font-normal text-amber-700">no cost set</span>}
                </td>
                <td className="px-4 py-2.5 text-right">{r.qty}</td>
                <td className="px-4 py-2.5 text-right">{formatINR(r.sales)}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{formatINR(r.cost)}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${r.profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {formatINR(r.profit)}
                </td>
                <td className="px-4 py-2.5 text-right">{r.sales ? `${round2((r.profit / r.sales) * 100)}%` : "-"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No sales in this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Line({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between px-1 ${strong ? "border-t border-sky-100 pt-2 text-base font-bold text-brand-navy" : ""}`}>
      <dt className={muted ? "text-slate-500" : "text-slate-700"}>{label}</dt>
      <dd className={strong ? "" : "font-semibold text-brand-navy"}>{value}</dd>
    </div>
  );
}
