"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Salary / Wages",
  "Electricity",
  "Transport / Delivery",
  "Phone & Internet",
  "Shop Maintenance",
  "Packaging",
  "Bank Charges",
  "Other",
];

export default function ExpenseForm({ today }: { today: string }) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, category, amount: Number(amount), note }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Could not save expense.");
      return;
    }
    setAmount("");
    setNote("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <div>
        <label className="label">Date</label>
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label">Type</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Amount (Rs)</label>
        <input
          type="number"
          required
          min={0.01}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
          className="input"
        />
      </div>
      <div>
        <label className="label">Note</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Optional" />
      </div>
      <button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving..." : "Add Expense"}</button>
      {error && <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-5">{error}</p>}
    </form>
  );
}

export function DeleteExpenseButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="text-xs font-medium text-red-600 hover:underline"
      onClick={async () => {
        if (!confirm("Delete this expense?")) return;
        await fetch(`/api/expenses/${id}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
