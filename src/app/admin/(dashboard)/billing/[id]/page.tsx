import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { paymentStatus } from "@/lib/billing";
import { formatDate } from "@/lib/dates";
import { formatINR, round2, stateLabel } from "@/lib/gst";
import { getSettings } from "@/lib/settings";
import { mailtoLink } from "@/lib/whatsapp";
import { billPath } from "@/lib/billLink";
import StatusBadge from "@/components/StatusBadge";
import { CancelInvoiceButton, RecordPayment } from "@/components/admin/InvoiceActions";
import WhatsAppBillButtons from "@/components/admin/WhatsAppBillButtons";

export const revalidate = 0;

export default async function BillDetailPage({ params }: { params: { id: string } }) {
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { id: "asc" } }, order: { select: { id: true, orderNumber: true } } },
    }),
    getSettings(),
  ]);
  if (!invoice) notFound();

  const status = paymentStatus(invoice);
  const balance = round2(invoice.total - invoice.amountPaid);
  const cancelled = invoice.status === "CANCELLED";
  const profit = round2(invoice.taxableTotal - invoice.costTotal);
  const pdfUrl = `/api/billing/invoices/${invoice.id}/pdf`;

  const message =
    `Hello ${invoice.billName}, thank you for your purchase from ${settings.businessName}.\n` +
    `Bill No: ${invoice.invoiceNumber}\nDate: ${formatDate(invoice.invoiceDate)}\nAmount: ${formatINR(invoice.total)}` +
    (balance > 0 ? `\nBalance due: ${formatINR(balance)}` : "") +
    (settings.upiId ? `\nUPI: ${settings.upiId}` : "") +
    `\n\n${settings.ownerName}\n${settings.ownerEmail}`;
  const phone = invoice.billPhone?.replace(/\D/g, "").slice(-10) || null;
  const h = headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const billLink = origin + billPath(invoice.id);
  const linkMessage = message.replace(
    `\n\n${settings.ownerName}`,
    `\n\nView / download your bill:\n${billLink}\n\n${settings.ownerName}`
  );
  const fileName = `${invoice.invoiceNumber.replace(/[^A-Za-z0-9-]+/g, "_")}.pdf`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/billing" className="text-sm text-brand-primary hover:underline">&larr; All bills</Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-bold text-brand-navy">
            {invoice.invoiceNumber} <StatusBadge status={status} />
          </h1>
          <p className="text-sm text-slate-500">
            {formatDate(invoice.invoiceDate)}
            {invoice.order && (
              <>
                {" · from web order "}
                <Link href={`/admin/orders/${invoice.order.id}`} className="text-brand-primary hover:underline">
                  {invoice.order.orderNumber}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">View / Print PDF</a>
          <a href={`${pdfUrl}?download=1`} className="btn-secondary">Download</a>
          {invoice.billEmail && (
            <a href={mailtoLink(`Invoice ${invoice.invoiceNumber} - ${settings.businessName}`, linkMessage, invoice.billEmail)} className="btn-secondary">
              Email
            </a>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4">
        <p className="mb-3 text-sm font-semibold text-brand-navy">
          Send to customer on WhatsApp{phone ? ` (${phone})` : ""}
        </p>
        <WhatsAppBillButtons pdfUrl={pdfUrl} fileName={fileName} phone={phone} message={message} linkMessage={linkMessage} />
        <p className="mt-2 text-xs text-slate-500">
          &quot;Send PDF&quot; attaches the bill file (works on phones and with the WhatsApp app). &quot;Send bill link&quot; opens the
          customer&apos;s chat with a private link to the PDF, on any device.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card overflow-x-auto p-5 lg:col-span-2">
          <table className="tabular w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-2">Item</th>
                <th className="py-2 pr-2">HSN</th>
                <th className="py-2 pr-2 text-right">Qty</th>
                <th className="py-2 pr-2 text-right">Rate</th>
                <th className="py-2 pr-2 text-right">Taxable</th>
                <th className="py-2 pr-2 text-right">GST</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-2 font-medium text-brand-navy">
                    {item.name}
                    {item.discountPct > 0 && <span className="block text-xs text-slate-500">{item.discountPct}% discount</span>}
                  </td>
                  <td className="py-2 pr-2 text-slate-500">{item.hsnCode || "-"}</td>
                  <td className="py-2 pr-2 text-right">{item.quantity}</td>
                  <td className="py-2 pr-2 text-right">{item.rate.toFixed(2)}</td>
                  <td className="py-2 pr-2 text-right">{item.taxableValue.toFixed(2)}</td>
                  <td className="py-2 pr-2 text-right">
                    {item.gstAmount.toFixed(2)} <span className="text-xs text-slate-400">({item.gstRate}%)</span>
                  </td>
                  <td className="py-2 text-right font-medium">{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">Rates {invoice.pricesIncTax ? "include" : "exclude"} GST.</p>

          <dl className="tabular ml-auto mt-4 max-w-xs space-y-1.5 border-t border-sky-100 pt-4 text-sm">
            <Line label="Taxable Amount" value={formatINR(invoice.taxableTotal)} />
            {invoice.interState ? (
              <Line label="IGST" value={formatINR(invoice.igst)} />
            ) : (
              <>
                <Line label="CGST" value={formatINR(invoice.cgst)} />
                <Line label="SGST" value={formatINR(invoice.sgst)} />
              </>
            )}
            {invoice.roundOff !== 0 && <Line label="Round Off" value={invoice.roundOff.toFixed(2)} />}
            <div className="flex justify-between rounded-lg bg-brand-primary px-3 py-2 font-bold text-white">
              <span>Grand Total</span>
              <span>{formatINR(invoice.total)}</span>
            </div>
            <Line label="Received" value={formatINR(invoice.amountPaid)} />
            <Line label="Balance Due" value={formatINR(balance)} />
          </dl>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-bold text-brand-navy">Billed To</h2>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <p className="font-semibold text-brand-navy">{invoice.billBusiness || invoice.billName}</p>
              {invoice.billBusiness && <p>{invoice.billName}</p>}
              {invoice.billAddress && <p>{invoice.billAddress}</p>}
              {invoice.billPhone && <p>Ph: {invoice.billPhone}</p>}
              {invoice.billEmail && <p>{invoice.billEmail}</p>}
              {invoice.billGstin && <p className="font-medium">GSTIN: {invoice.billGstin}</p>}
              <p className="text-slate-500">Place of supply: {stateLabel(invoice.placeOfSupply)}</p>
            </div>
            {invoice.customerId && (
              <Link href={`/admin/customers/${invoice.customerId}`} className="mt-3 inline-block text-sm text-brand-primary hover:underline">
                Customer history &rarr;
              </Link>
            )}
          </div>

          {!cancelled && (
            <div className="card p-5">
              <h2 className="mb-3 font-bold text-brand-navy">Receive Payment</h2>
              <RecordPayment id={invoice.id} total={invoice.total} amountPaid={invoice.amountPaid} />
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-bold text-brand-navy">Profit on this bill</h2>
            <p className={`tabular mt-1 text-2xl font-bold ${profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatINR(profit)}</p>
            <p className="text-xs text-slate-500">
              Sale value (before GST) {formatINR(invoice.taxableTotal)} minus purchase cost {formatINR(invoice.costTotal)}.
            </p>
          </div>

          {invoice.notes && (
            <div className="card p-5 text-sm">
              <h2 className="font-bold text-brand-navy">Notes</h2>
              <p className="mt-1 whitespace-pre-line text-slate-700">{invoice.notes}</p>
            </div>
          )}

          {!cancelled && <CancelInvoiceButton id={invoice.id} number={invoice.invoiceNumber} />}
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-1">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-semibold text-brand-navy">{value}</dd>
    </div>
  );
}
