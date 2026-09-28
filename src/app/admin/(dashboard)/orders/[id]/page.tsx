import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import OrderStatusControls from "@/components/OrderStatusControls";
import { whatsappLink, telLink } from "@/lib/whatsapp";

export const revalidate = 0;

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, invoice: { select: { id: true, invoiceNumber: true } } },
  });
  if (!order) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-brand-navy dark:text-white">Order {order.orderNumber}</h1>
        <OrderStatusControls orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold text-brand-navy dark:text-white">Items</h2>
          <table className="mt-3 w-full text-left text-sm dark:text-gray-200">
            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Price</th>
                <th className="py-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">Rs {item.price.toFixed(2)}</td>
                  <td className="py-2 font-medium">Rs {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end border-t border-gray-200 pt-4 text-base font-bold text-brand-navy dark:border-gray-700 dark:text-white">
            Total: Rs {order.subtotal.toFixed(2)}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {order.invoice ? (
              <Link href={`/admin/billing/${order.invoice.id}`} className="btn-primary">
                GST Bill {order.invoice.invoiceNumber}
              </Link>
            ) : (
              <Link href={`/admin/billing/new?order=${order.id}`} className="btn-primary">
                Create GST Bill
              </Link>
            )}
            <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Quotation PDF
            </a>
            <a
              href={whatsappLink(
                `Hello ${order.customerName}, this is Mahalaxmi Auto Agency regarding your order ${order.orderNumber}.`,
                `91${order.customerPhone.replace(/\D/g, "").slice(-10)}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              Message Customer on WhatsApp
            </a>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-brand-navy dark:text-white">Customer Details</h2>
          <dl className="mt-3 space-y-2 text-sm dark:text-gray-200">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="font-medium">{order.customerName}</dd>
            </div>
            {order.businessName && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Business</dt>
                <dd className="font-medium">{order.businessName}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
              <dd className="font-medium">
                <a href={telLink(order.customerPhone)} className="hover:text-brand-primary">{order.customerPhone}</a>
              </dd>
            </div>
            {order.customerEmail && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="font-medium">{order.customerEmail}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Address</dt>
              <dd className="font-medium">{order.customerAddress}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Payment Method</dt>
              <dd className="font-medium">{order.paymentMethod}</dd>
            </div>
            {order.notes && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Notes</dt>
                <dd className="font-medium">{order.notes}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Placed On</dt>
              <dd className="font-medium">{new Date(order.createdAt).toLocaleString("en-IN")}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
