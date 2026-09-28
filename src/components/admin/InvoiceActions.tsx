"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { round2 } from "@/lib/gst";

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"];

export function RecordPayment({ id, total, amountPaid }: { id: string; total: number; amountPaid: number }) {
  const router = useRouter();
  const balance = round2(total - amountPaid);
  const [amount, setAmount] = useState<number | "">(balance);
  const [mode, setMode] = useState("Cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (balance <= 0) return <p className="text-sm font-medium text-emerald-700">Fully paid.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const add = Number(amount) || 0;
    if (add <= 0) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/billing/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", amountPaid: round2(amountPaid + add), paymentMode: mode }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Could not record payment.");
      return;
    }
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount (Rs)</label>
          <input
            type="number"
            min={0.01}
            max={balance}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="input"
          />
        </div>
        <div>
          <label className="label">Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="input">
            {PAYMENT_MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="btn-primary w-full disabled:opacity-60">
        {saving ? "Saving..." : "Record Payment"}
      </button>
    </form>
  );
}

export function CancelInvoiceButton({ id, number }: { id: string; number: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      className="btn-danger"
      onClick={async () => {
        if (!confirm(`Cancel bill ${number}? Its items go back into stock. The bill number stays used, marked CANCELLED.`)) return;
        setBusy(true);
        await fetch(`/api/billing/invoices/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        });
        router.refresh();
      }}
    >
      {busy ? "Cancelling..." : "Cancel Bill"}
    </button>
  );
}
