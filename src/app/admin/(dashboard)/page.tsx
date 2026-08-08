import Link from "next/link";
import { prisma } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";

export const revalidate = 0;

export default async function AdminDashboard() {
  const [totalProducts, totalOrders, pendingOrders, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
  ]);

  const stats = [
    { label: "Total Products", value: totalProducts },
    { label: "Total Orders", value: totalOrders },
    { label: "Pending Orders", value: pendingOrders },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy dark:text-white">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-brand-navy dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-navy dark:text-white">Recent Orders</h2>
        <Link href="/admin/orders" className="text-sm font-semibold text-brand-red hover:underline">
          View all &rarr;
        </Link>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-light text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentOrders.map((o) => (
              <tr key={o.id} className="hover:bg-brand-light dark:text-gray-200 dark:hover:bg-gray-800">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-brand-navy hover:underline dark:text-white">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3">{o.items.length}</td>
                <td className="px-4 py-3">Rs {o.subtotal.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
