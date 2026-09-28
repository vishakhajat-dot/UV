import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { purchaseStatus } from "@/lib/purchases";
import { formatDate, rangeFromParams } from "@/lib/dates";
import { formatINR, round2 } from "@/lib/gst";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/admin/StatCard";
import DateRangeFilter from "@/components/admin/DateRangeFilter";

export const revalidate = 0;

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "due", label: "Due / Partly paid" },
  { key: "paid", label: "Paid" },
];

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; q?: string; status?: string; vendor?: string };
}) {
  // With a status or vendor filter, show every date by default so nothing unpaid hides.
  const allDates = !searchParams.from && !searchParams.to && (!!searchParams.status || !!searchParams.vendor);
  const range = rangeFromParams(searchParams);
  const q = searchParams.q?.trim();

  const where: Prisma.PurchaseBillWhereInput = {
    ...(allDates ? {} : { billDate: { gte: range.gte, lte: range.lte } }),
    ...(searchParams.vendor ? { vendorId: searchParams.vendor } : {}),
    ...(q
      ? {
          OR: [
            { billNumber: { contains: q, mode: "insensitive" } },
            { vendor: { name: { contains: q, mode: "insensitive" } } },
            { notes: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const all = await prisma.purchaseBill.findMany({
    where,
    include: { vendor: { select: { name: true } }, _count: { select: { attachments: true } } },
    orderBy: [{ billDate: "desc" }, { createdAt: "desc" }],
  });
  const bills = all.filter((b) => {
    const s = purchaseStatus(b);
    if (searchParams.status === "paid") return s === "PAID";
    if (searchParams.status === "due") return s !== "PAID";
    return true;
  });

  const total = round2(bills.reduce((s, b) => s + b.total, 0));
  const paid = round2(bills.reduce((s, b) => s + b.amountPaid, 0));
  const itc = round2(bills.reduce((s, b) => s + b.cgst + b.sgst + b.igst, 0));
  const vendorName = searchParams.vendor ? all[0]?.vendor.name : null;

  const filterHref = (status: string) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (searchParams.vendor) p.set("vendor", searchParams.vendor);
    const s = p.toString();
    return `/admin/purchases${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Purchases{vendorName ? `: ${vendorName}` : ""}</h1>
          <p className="text-sm text-slate-500">Bills from your vendors. Saving one adds the items to stock.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/vendors" className="btn-secondary">Vendors</Link>
          <Link href="/admin/purchases/new" className="btn-primary">+ New Purchase</Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={filterHref(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              (searchParams.status ?? "") === f.key ? "bg-brand-primary text-white" : "bg-brand-light text-brand-navy hover:bg-sky-100"
            }`}
          >
            {f.label}
          </Link>
        ))}
        {searchParams.vendor && (
          <Link href="/admin/purchases" className="rounded-full px-4 py-1.5 text-sm font-medium text-brand-primary hover:underline">
            Clear vendor filter
          </Link>
        )}
      </div>

      <div className="card mt-4 p-4">
        <DateRangeFilter
          from={allDates ? "" : range.from}
          to={allDates ? "" : range.to}
          basePath="/admin/purchases"
          extra={
            <>
              {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
              {searchParams.vendor && <input type="hidden" name="vendor" value={searchParams.vendor} />}
              <div className="min-w-[12rem] flex-1">
                <label className="label">Search</label>
                <input name="q" defaultValue={q} placeholder="Vendor, bill no. or note" className="input" />
              </div>
            </>
          }
        />
        {allDates && <p className="mt-2 text-xs text-slate-500">Showing all dates.</p>}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Purchased" value={formatINR(total)} sub={`${bills.length} bills`} />
        <StatCard label="Paid" value={formatINR(paid)} tone="good" />
        <StatCard label="You Owe" value={formatINR(round2(total - paid))} tone={total - paid > 0.5 ? "warn" : "default"} />
        <StatCard label="GST Input Credit" value={formatINR(itc)} />
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="tabular w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Bill No.</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-50">
            {bills.map((b) => (
              <tr key={b.id} className="hover:bg-brand-pale">
                <td className="px-4 py-3 text-slate-600">{formatDate(b.billDate)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/purchases/${b.id}`} className="font-semibold text-brand-primary hover:underline">
                    {b.vendor.name}
                  </Link>
                  {b._count.attachments > 0 && (
                    <span className="ml-2 text-xs text-slate-500">{b._count.attachments} file{b._count.attachments > 1 ? "s" : ""}</span>
                  )}
                </td>
                <td className="px-4 py-3">{b.billNumber || "-"}</td>
                <td className="px-4 py-3 text-right font-medium">{formatINR(b.total)}</td>
                <td className="px-4 py-3 text-right">{formatINR(round2(b.total - b.amountPaid))}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={purchaseStatus(b)} />
                  {b.dueDate && b.amountPaid < b.total - 0.005 && (
                    <span className="block pt-1 text-xs text-slate-500">pay by {formatDate(b.dueDate)}</span>
                  )}
                </td>
              </tr>
            ))}
            {bills.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No purchases here. <Link href="/admin/purchases/new" className="text-brand-primary hover:underline">Add one</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
