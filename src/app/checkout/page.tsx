"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

const PAYMENT_OPTIONS = [
  { value: "COD", label: "Cash on Delivery" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "UPI", label: "UPI (Pay on delivery/pickup)" },
  { value: "PICKUP", label: "Pay at Store Pickup" },
];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: "",
    businessName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    notes: "",
    paymentMethod: "COD",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-brand-navy dark:text-white">Your Cart is Empty</h1>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const handleChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.formErrors?.[0] || "Could not place order. Please check your details.");
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/order/${json.order.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-brand-navy dark:text-white">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="card space-y-4 p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-brand-navy dark:text-white">Delivery &amp; Contact Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name *">
              <input
                required
                value={form.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Business / Shop Name">
              <input
                value={form.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Phone Number *">
              <input
                required
                type="tel"
                value={form.customerPhone}
                onChange={(e) => handleChange("customerPhone", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Email (optional)">
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => handleChange("customerEmail", e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Delivery / Shop Address *">
            <textarea
              required
              rows={3}
              value={form.customerAddress}
              onChange={(e) => handleChange("customerAddress", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Order Notes (optional)">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="input"
              placeholder="Any special instructions..."
            />
          </Field>

          <Field label="Preferred Payment Method *">
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm dark:text-gray-100 ${
                    form.paymentMethod === opt.value
                      ? "border-brand-navy bg-brand-light dark:border-brand-sky dark:bg-gray-800"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={form.paymentMethod === opt.value}
                    onChange={(e) => handleChange("paymentMethod", e.target.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              No online payment is collected here. This places an order request &mdash; the shop will
              confirm final pricing and payment with you directly.
            </p>
          </Field>

          {error && <p className="text-sm text-brand-primary">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? "Placing Order..." : "Place Order"}
          </button>
        </form>

        <div className="card h-fit p-6">
          <h2 className="text-lg font-bold text-brand-navy dark:text-white">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {item.name} &times; {item.quantity}
                </span>
                <span className="font-medium text-brand-navy dark:text-white">Rs {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-brand-navy dark:border-gray-700 dark:text-white">
            <span>Total</span>
            <span>Rs {subtotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  );
}
