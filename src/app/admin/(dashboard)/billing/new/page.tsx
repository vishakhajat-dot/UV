import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { todayYmd } from "@/lib/dates";
import InvoiceForm, { InvoicePrefill } from "@/components/admin/InvoiceForm";

export const revalidate = 0;

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: { order?: string; customer?: string };
}) {
  const [products, customers, settings] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, hsnCode: true, gstRate: true, price: true, unit: true, stock: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      select: { id: true, name: true, businessName: true, phone: true, email: true, address: true, state: true, gstin: true },
      orderBy: { name: "asc" },
    }),
    getSettings(),
  ]);

  let prefill: InvoicePrefill | undefined;
  let orderNote: React.ReactNode = null;

  // "Create GST bill" from a website order: copy the customer and items across.
  if (searchParams.order) {
    const order = await prisma.order.findUnique({
      where: { id: searchParams.order },
      include: { items: { include: { product: true } }, invoice: { select: { id: true, invoiceNumber: true } } },
    });
    if (order?.invoice) {
      return (
        <div className="card p-6">
          <p className="text-brand-navy">
            Order {order.orderNumber} already has bill{" "}
            <Link href={`/admin/billing/${order.invoice.id}`} className="font-semibold text-brand-primary hover:underline">
              {order.invoice.invoiceNumber}
            </Link>
            .
          </p>
        </div>
      );
    }
    if (order) {
      const saved = customers.find((c) => c.phone === order.customerPhone);
      prefill = {
        orderId: order.id,
        customerId: saved?.id ?? null,
        customer: saved
          ? { ...saved }
          : {
              name: order.customerName,
              businessName: order.businessName,
              phone: order.customerPhone,
              email: order.customerEmail,
              address: order.customerAddress,
              state: settings.state,
              gstin: null,
            },
        items: order.items.map((i) => ({
          productId: i.productId,
          name: i.productName,
          hsnCode: i.product.hsnCode ?? "",
          unit: i.product.unit,
          quantity: i.quantity,
          rate: i.price,
          discountPct: 0,
          gstRate: i.product.gstRate,
        })),
        notes: `Website order ${order.orderNumber}`,
      };
      orderNote = (
        <p className="mt-1 text-sm text-slate-600">
          Filled in from website order <span className="font-semibold">{order.orderNumber}</span>. Check the details, then save.
        </p>
      );
    }
  } else if (searchParams.customer) {
    const c = customers.find((x) => x.id === searchParams.customer);
    if (c) prefill = { customerId: c.id, customer: { ...c } };
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">New GST Bill</h1>
      {orderNote}
      {!settings.gstin && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Your GSTIN isn&apos;t set yet, so it won&apos;t print on bills.{" "}
          <Link href="/admin/settings" className="font-semibold underline">Add it in Settings</Link>.
        </p>
      )}
      <div className="mt-6">
        <InvoiceForm
          products={products}
          customers={customers}
          businessState={settings.state}
          today={todayYmd()}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
