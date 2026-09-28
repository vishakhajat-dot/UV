import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { paymentStatus } from "@/lib/billing";
import { formatDate } from "@/lib/dates";
import { formatINR, round2 } from "@/lib/gst";
import { telLink, whatsappLink } from "@/lib/whatsapp";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/admin/StatCard";
import CustomerForm from "@/components/admin/CustomerForm";

export const revalidate = 0;

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: { invoices: { orderBy: { invoiceDate: "desc" } } },
  });
  if (!customer) notFound();

  const active = customer.invoices.filter((i) => i.status !== "CANCELLED");
  const billed = round2(active.reduce((s, i) => s + i.total, 0));
  const paid = round2(active.reduce((s, i) => s + i.amountPaid, 0));
  const due = round2(billed - paid);
  const phone = customer.phone.replace(/\D/g, "").slice(-10);
  const { invoices: _invoices, createdAt: _c, updatedAt: _u, ...formData } = customer;

  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-brand-primary hover:underline">&larr; All customers</Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{customer.businessName || customer.name}</h1>
          {customer.businessName && <p className="text-slate-600">{customer.name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/billing/new?customer=${customer.id}`} className="btn-primary">+ New Bill</Link>
          <a href={telLink(customer.phone)} className="btn-secondary">Call</a>
          <a
            href={whatsappLink(
              due > 0
                ? `Hello ${customer.name}, a friendly reminder from Mahalaxmi Auto Agency: ${formatINR(due)} is pending on your account. Thank you!`
                : `Hello ${customer.name}, greetings from Mahalaxmi Auto Agency.`,
              `91${phone}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            {due > 0 ? "Send Payment Reminder" : "WhatsApp"}
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Billed" value={formatINR(billed)} sub={`${active.length} bills`} />
        <StatCard label="Received" value={formatINR(paid)} tone="good" />
        <StatCard label="Balance Due" value={formatINR(due)} tone={due > 0.5 ? "warn" : "default"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="card overflow-x-auto lg:col-span-3">
          <h2 className="px-5 pt-5 font-bold text-brand-navy">Bills</h2>
          <table className="tabular mt-3 w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2.5">Bill No.</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {customer.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/billing/${inv.id}`} className="font-medium text-brand-primary hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-2.5 text-right">{formatINR(inv.total)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={paymentStatus(inv)} /></td>
                </tr>
              ))}
              {customer.invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No bills yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-bold text-brand-navy">Details</h2>
          <CustomerForm initial={formData} defaultState={customer.state} />
        </div>
      </div>
    </div>
  );
}
