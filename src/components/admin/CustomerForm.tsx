"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INDIAN_STATES } from "@/lib/gst";

export type CustomerFormData = {
  id?: string;
  name: string;
  businessName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  state: string;
  gstin: string | null;
  notes: string | null;
};

export default function CustomerForm({ initial, defaultState }: { initial?: CustomerFormData; defaultState: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CustomerFormData>(
    initial ?? { name: "", businessName: "", phone: "", email: "", address: "", state: defaultState, gstin: "", notes: "" }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!initial?.id;

  const set = (key: keyof CustomerFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: key === "gstin" ? e.target.value.toUpperCase() : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(isEdit ? `/api/customers/${initial!.id}` : "/api/customers", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "Could not save customer.");
      return;
    }
    router.push(`/admin/customers/${json.customer.id}`);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm("Delete this customer? Their past bills stay, but are no longer linked to them.")) return;
    await fetch(`/api/customers/${initial!.id}`, { method: "DELETE" });
    router.push("/admin/customers");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Name *</label>
          <input required value={form.name} onChange={set("name")} className="input" />
        </div>
        <div>
          <label className="label">Business / Shop Name</label>
          <input value={form.businessName ?? ""} onChange={set("businessName")} className="input" />
        </div>
        <div>
          <label className="label">Phone *</label>
          <input required inputMode="tel" value={form.phone} onChange={set("phone")} className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" value={form.email ?? ""} onChange={set("email")} className="input" />
        </div>
        <div>
          <label className="label">GSTIN</label>
          <input maxLength={15} value={form.gstin ?? ""} onChange={set("gstin")} className="input uppercase" placeholder="Blank if unregistered" />
        </div>
        <div>
          <label className="label">State</label>
          <select value={form.state} onChange={set("state")} className="input">
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.name}>{s.code} - {s.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address</label>
          <input value={form.address ?? ""} onChange={set("address")} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea rows={2} value={form.notes ?? ""} onChange={set("notes")} className="input" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Customer"}
        </button>
        {isEdit && (
          <button type="button" onClick={remove} className="btn-danger">Delete Customer</button>
        )}
      </div>
    </form>
  );
}
