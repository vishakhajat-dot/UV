import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR, round2 } from "@/lib/gst";

export const revalidate = 0;

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { businessName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { gstin: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      invoices: { where: { status: { not: "CANCELLED" } }, select: { total: true, amountPaid: true, invoiceDate: true } },
    },
    orderBy: { name: "asc" },
  });

  const rows = customers.map((c) => {
    const billed = round2(c.invoices.reduce((s, i) => s + i.total, 0));
    const paid = round2(c.invoices.reduce((s, i) => s + i.amountPaid, 0));
    const last = c.invoices.reduce<Date | null>((d, i) => (!d || i.invoiceDate > d ? i.invoiceDate : d), null);
    return { ...c, billed, due: round2(billed - paid), bills: c.invoices.length, last };
  });
  const totalDue = round2(rows.reduce((s, r) => s + r.due, 0));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Customers</h1>
          <p className="text-sm text-slate-500">
            {customers.length} customers · {formatINR(totalDue)} to collect
          </p>
        </div>
        <Link href="/admin/customers/new" className="btn-primary">+ Add Customer</Link>
      </div>

      <form className="mt-6 flex max-w-md gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, shop, phone or GSTIN" className="input" />
        <button className="btn-secondary shrink-0 px-4 py-2">Search</button>
      </form>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">GSTIN</th>
              <th className="px-4 py-3 text-right">Bills</th>
              <th className="px-4 py-3 text-right">Total Billed</th>
              <th className="px-4 py-3 text-right">Due</th>
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-sky-50">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-brand-pale">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="font-semibold text-brand-primary hover:underline">
                    {c.businessName || c.name}
                  </Link>
                  {c.businessName && <span className="block text-xs text-slate-500">{c.name}</span>}
                </td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3 text-xs">{c.gstin || "-"}</td>
                <td className="px-4 py-3 text-right">{c.bills}</td>
                <td className="px-4 py-3 text-right">{formatINR(c.billed)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${c.due > 0.5 ? "text-amber-700" : "text-slate-400"}`}>
                  {formatINR(c.due)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  {q ? "No customers match that search." : "No customers yet. They're added automatically when you save a bill with a phone number."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
