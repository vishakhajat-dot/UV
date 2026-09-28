import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { billPdfPath, verifyBillToken } from "@/lib/billLink";
import { paymentStatus } from "@/lib/billing";
import { formatDate } from "@/lib/dates";
import { formatINR, round2 } from "@/lib/gst";
import { getSettings } from "@/lib/settings";
import { telLink, whatsappLink } from "@/lib/whatsapp";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Your Bill | Mahalaxmi Auto Agency",
  robots: { index: false, follow: false },
};

// Customer-facing bill page, reached from the link sent on WhatsApp / email.
export default async function CustomerBillPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { k?: string };
}) {
  if (!verifyBillToken(params.id, searchParams.k)) notFound();
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({ where: { id: params.id }, include: { items: { orderBy: { id: "asc" } } } }),
    getSettings(),
  ]);
  if (!invoice) notFound();

  const balance = round2(invoice.total - invoice.amountPaid);
  const status = paymentStatus(invoice);
  const shopWhatsApp = settings.phone.replace(/\D/g, "").slice(0, 10);

  return (
    <div className="bg-gradient-to-b from-brand-light to-white py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl px-4">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-4 border-b border-sky-100 p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" className="h-14 w-auto rounded-lg" />
            <div className="min-w-0">
              <p className="font-bold text-brand-navy">{settings.businessName}</p>
              <p className="text-xs text-slate-500">
                {settings.ownerName} · {settings.ownerEmail}
              </p>
            </div>
          </div>

          <div className="p-5">
            {invoice.status === "CANCELLED" && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">This bill has been cancelled.</p>
            )}
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Tax Invoice</p>
            <h1 className="mt-1 text-xl font-bold text-brand-navy">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-slate-600">
              {formatDate(invoice.invoiceDate)} · for {invoice.billBusiness || invoice.billName}
            </p>

            <div className="mt-5 rounded-xl bg-brand-primary px-4 py-4 text-white">
              <p className="text-sm text-sky-100">Bill Amount</p>
              <p className="tabular text-3xl font-extrabold">{formatINR(invoice.total)}</p>
              {status !== "CANCELLED" && (
                <p className="mt-1 text-sm text-sky-50">
                  {status === "PAID" ? "Paid in full. Thank you!" : `Balance due: ${formatINR(balance)}`}
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a href={billPdfPath(invoice.id, true)} download className="btn-primary py-3 text-base">
                Download PDF
              </a>
              <a href={billPdfPath(invoice.id, false)} target="_blank" rel="noopener noreferrer" className="btn-secondary py-3 text-base">
                View PDF
              </a>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              On phones the PDF saves to your Downloads / Files. Keep this link to download it again anytime.
            </p>

            <ul className="mt-6 divide-y divide-sky-50 text-sm">
              {invoice.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2">
                  <span className="text-slate-700">
                    {item.name} <span className="text-slate-400">× {item.quantity}</span>
                  </span>
                  <span className="tabular shrink-0 font-medium text-brand-navy">{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            {balance > 0 && status !== "CANCELLED" && settings.upiId && (
              <p className="mt-4 rounded-lg bg-brand-light px-3 py-2 text-sm text-brand-navy">
                Pay by UPI: <span className="font-semibold">{settings.upiId}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-sky-100 bg-brand-pale p-5">
            <a
              href={whatsappLink(`Hello, I have a question about bill ${invoice.invoiceNumber}.`, `91${shopWhatsApp}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp flex-1"
            >
              Ask on WhatsApp
            </a>
            <a href={telLink(shopWhatsApp)} className="btn-secondary flex-1">Call Shop</a>
          </div>
        </div>
      </div>
    </div>
  );
}
