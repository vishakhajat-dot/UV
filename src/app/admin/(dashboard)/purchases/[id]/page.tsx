import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { purchaseStatus } from "@/lib/purchases";
import { formatDate } from "@/lib/dates";
import { formatINR, round2, stateLabel } from "@/lib/gst";
import StatusBadge from "@/components/StatusBadge";
import { RecordPayment } from "@/components/admin/InvoiceActions";
import AttachmentsPanel from "@/components/admin/AttachmentsPanel";
import DeletePurchaseButton from "@/components/admin/DeletePurchaseButton";

export const revalidate = 0;

export default async function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const bill = await prisma.purchaseBill.findUnique({
    where: { id: params.id },
    include: {
      vendor: true,
      items: { orderBy: { id: "asc" } },
      attachments: { select: { id: true, fileName: true, mimeType: true, size: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!bill) notFound();

  const balance = round2(bill.total - bill.amountPaid);

  return (
    <div>
      <Link href="/admin/purchases" className="text-sm text-brand-primary hover:underline">&larr; All purchases</Link>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-brand-navy">
            {bill.vendor.name} <StatusBadge status={purchaseStatus(bill)} />
          </h1>
          <p className="text-sm text-slate-500">
            {bill.billNumber ? `Bill ${bill.billNumber} · ` : ""}
            {formatDate(bill.billDate)}
            {bill.dueDate && ` · pay by ${formatDate(bill.dueDate)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/purchases/${bill.id}/edit`} className="btn-primary">Edit</Link>
          <Link href={`/admin/purchases?vendor=${bill.vendorId}`} className="btn-secondary">All bills from this vendor</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card overflow-x-auto p-5">
            <table className="tabular w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-2">Item</th>
                  <th className="py-2 pr-2 text-right">Qty</th>
                  <th className="py-2 pr-2 text-right">Rate</th>
                  <th className="py-2 pr-2 text-right">Taxable</th>
                  <th className="py-2 pr-2 text-right">GST</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {bill.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-2 font-medium text-brand-navy">
                      {item.name}
                      <span className="block text-xs font-normal text-slate-500">
                        {item.productId ? `+${item.quantity} added to stock` : "not a stock item"}
                        {item.hsnCode && ` · HSN ${item.hsnCode}`}
                        {item.discountPct > 0 && ` · ${item.discountPct}% off`}
                      </span>
                    </td>
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
            <p className="mt-2 text-xs text-slate-500">Rates {bill.pricesIncTax ? "include" : "exclude"} GST.</p>
            <dl className="tabular ml-auto mt-4 max-w-xs space-y-1.5 border-t border-sky-100 pt-4 text-sm">
              <Line label="Taxable Amount" value={formatINR(bill.taxableTotal)} />
              {bill.interState ? (
                <Line label="IGST" value={formatINR(bill.igst)} />
              ) : (
                <>
                  <Line label="CGST" value={formatINR(bill.cgst)} />
                  <Line label="SGST" value={formatINR(bill.sgst)} />
                </>
              )}
              {bill.roundOff !== 0 && <Line label="Round Off" value={bill.roundOff.toFixed(2)} />}
              <div className="flex justify-between rounded-lg bg-brand-navy px-3 py-2 font-bold text-white">
                <span>Bill Total</span>
                <span>{formatINR(bill.total)}</span>
              </div>
              <Line label="Paid" value={formatINR(bill.amountPaid)} />
              <Line label="Still to Pay" value={formatINR(balance)} />
            </dl>
          </div>

          <AttachmentsPanel purchaseId={bill.id} attachments={bill.attachments} />
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-bold text-brand-navy">Pay Vendor</h2>
            <RecordPayment id={bill.id} total={bill.total} amountPaid={bill.amountPaid} endpoint={`/api/purchases/${bill.id}`} />
            {bill.paymentMode && bill.amountPaid > 0 && (
              <p className="mt-3 text-xs text-slate-500">Last payment mode: {bill.paymentMode}</p>
            )}
          </div>

          <div className="card p-5 text-sm">
            <h2 className="font-bold text-brand-navy">Vendor</h2>
            <div className="mt-2 space-y-1 text-slate-700">
              <p className="font-semibold text-brand-navy">{bill.vendor.name}</p>
              {bill.vendor.phone && <p>Ph: {bill.vendor.phone}</p>}
              {bill.vendor.gstin && <p>GSTIN: {bill.vendor.gstin}</p>}
              {bill.vendor.address && <p>{bill.vendor.address}</p>}
              <p className="text-slate-500">{stateLabel(bill.vendor.state)}</p>
            </div>
          </div>

          {bill.notes && (
            <div className="card p-5 text-sm">
              <h2 className="font-bold text-brand-navy">Notes</h2>
              <p className="mt-1 whitespace-pre-line text-slate-700">{bill.notes}</p>
            </div>
          )}

          <DeletePurchaseButton id={bill.id} />
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
