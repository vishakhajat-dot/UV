"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"];
const PAYMENT_STATUSES = ["UNPAID", "PAID"];

export default function OrderStatusControls({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
}) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const update = async (field: "status" | "paymentStatus", value: string) => {
    setSaving(true);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Order Status</label>
        <select
          value={status}
          disabled={saving}
          onChange={(e) => update("status", e.target.value)}
          className="input"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Payment Status</label>
        <select
          value={paymentStatus}
          disabled={saving}
          onChange={(e) => update("paymentStatus", e.target.value)}
          className="input"
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
