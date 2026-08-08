import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 0;

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!order) notFound();

  const summaryLines = order.items.map((i) => `- ${i.productName} x${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`);
  const message = [
    `Hello Mahalaxmi Auto Agency, I've placed an order on the website.`,
    ``,
    `Order #: ${order.orderNumber}`,
    `Name: ${order.customerName}${order.businessName ? ` (${order.businessName})` : ""}`,
    `Phone: ${order.customerPhone}`,
    `Address: ${order.customerAddress}`,
    ``,
    `Items:`,
    ...summaryLines,
    ``,
    `Total: Rs ${order.subtotal.toFixed(2)}`,
    `Payment: ${order.paymentMethod}`,
    ``,
    `Please confirm this order. Thank you!`,
  ].join("\n");

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-brand-navy dark:text-white">Order Request Placed!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Thank you, {order.customerName}. Your order request <strong>{order.orderNumber}</strong> has been
          received. Please confirm it on WhatsApp so we can process it right away.
        </p>

        <div className="card mt-8 text-left">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <span className="font-semibold text-brand-navy dark:text-white">Order #{order.orderNumber}</span>
            <span className="rounded-full bg-brand-gold/20 px-3 py-1 text-xs font-semibold text-brand-gold">
              {order.status}
            </span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between p-4 text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {item.productName} &times; {item.quantity}
                </span>
                <span className="font-medium text-brand-navy dark:text-white">Rs {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between p-4 text-base font-bold text-brand-navy dark:text-white">
            <span>Total</span>
            <span>Rs {order.subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            Confirm Order on WhatsApp
          </a>
          <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Download / Print Bill (PDF)
          </a>
        </div>

        <Link href="/products" className="mt-6 inline-block text-sm font-semibold text-brand-red hover:underline">
          &larr; Continue Shopping
        </Link>
      </div>
    </div>
  );
}
