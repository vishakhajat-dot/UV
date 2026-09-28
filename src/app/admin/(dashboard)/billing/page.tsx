import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { paymentStatus } from "@/lib/billing";
import { rangeFromParams, formatDate } from "@/lib/dates";
import { formatINR, round2 } from "@/lib/gst";
import StatusBadge from "@/components/StatusBadge";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import StatCard from "@/components/admin/StatCard";

export const revalidate = 0;

export default async function BillsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; q?: string };
}) {
  const range = rangeFromParams(searchParams);
  const q = searchParams.q?.trim();

  const where: Prisma.InvoiceWhereInput = {
    invoiceDate: { gte: range.gte, lte: range.lte },
    ...(q
      ? {
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { billName: { contains: q, mode: "insensitive" } },
            { billBusiness: { contains: q, mode: "insensitive" } },
            { billPhone: { contains: q } },
          ],
        }
      : {}),
  };
  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: [{ invoiceDate: "desc" }, { invoiceNumber: "desc" }],
  });

  const active = invoices.filter((i) => i.status !== "CANCELLED");
  const sales = round2(active.reduce((s, i) => s + i.total, 0));
  const received = round2(active.reduce((s, i) => s + i.amountPaid, 0));
  const tax = round2(active.reduce((s, i) => s + i.cgst + i.sgst + i.igst, 0));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-navy">Bills</h1>
        <Link href="/admin/billing/new" className="btn-primary">+ New Bill</Link>
      </div>

      <div className="card mt-6 p-4">
        <DateRangeFilter
          from={range.from}
          to={range.to}
          basePath="/admin/billing"
          extra={
            <div className="min-w-[12rem] flex-1">
              <label className="label">Search</label>
              <input name="q" defaultValue={q} placeholder="Bill no., customer or phone" className="input" />
            </div>
          }
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="Bills" value={String(active.length)} />
        <StatCard label="Total Sales" value={formatINR(sales)} />
        <StatCard label="GST Collected" value={formatINR(tax)} />
        <StatCard label="Pending to Collect" value={formatINR(round2(sales - received))} tone={sales - received > 0.5 ? "warn" : "default"} />
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Bill No.</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">PDF</th>
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-sky-50">
            {invoices.map((inv) => {
              const status = paymentStatus(inv);
              return (
                <tr key={inv.id} className={`hover:bg-brand-pale ${inv.status === "CANCELLED" ? "text-slate-400 line-through" : ""}`}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/billing/${inv.id}`} className="font-semibold text-brand-primary hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-brand-navy">{inv.billBusiness || inv.billName}</span>
                    {inv.billPhone && <span className="block text-xs text-slate-500">{inv.billPhone}</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatINR(inv.total)}</td>
                  <td className="px-4 py-3 text-right">{formatINR(round2(inv.total - inv.amountPaid))}</td>
                  <td className="px-4 py-3"><StatusBadge status={status} /></td>
                  <td className="px-4 py-3">
                    <a href={`/api/billing/invoices/${inv.id}/pdf?download=1`} className="text-sm font-medium text-brand-primary no-underline hover:underline">
                      Download
                    </a>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  No bills in this period. <Link href="/admin/billing/new" className="text-brand-primary hover:underline">Make one</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
