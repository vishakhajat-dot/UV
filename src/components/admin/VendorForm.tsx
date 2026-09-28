"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INDIAN_STATES } from "@/lib/gst";

export type VendorFormData = {
  id?: string;
  name: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  address: string | null;
  state: string;
  notes: string | null;
};

// Add or edit a vendor. Used inline on the Vendors page.
export default function VendorForm({ initial, defaultState, onDone }: { initial?: VendorFormData; defaultState: string; onDone?: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<VendorFormData>(
    initial ?? { name: "", phone: "", email: "", gstin: "", address: "", state: defaultState, notes: "" }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!initial?.id;

  const set = (key: keyof VendorFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: key === "gstin" ? e.target.value.toUpperCase() : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(isEdit ? `/api/vendors/${initial!.id}` : "/api/vendors", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Could not save vendor.");
      return;
    }
    if (!isEdit) setForm({ name: "", phone: "", email: "", gstin: "", address: "", state: defaultState, notes: "" });
    onDone?.();
    router.refresh();
  };

  const remove = async () => {
    if (!confirm(`Delete vendor ${initial!.name}?`)) return;
    const res = await fetch(`/api/vendors/${initial!.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Could not delete vendor.");
      return;
    }
    onDone?.();
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="label">Vendor Name *</label>
        <input required value={form.name} onChange={set("name")} className="input" />
      </div>
      <div>
        <label className="label">Phone</label>
        <input value={form.phone ?? ""} onChange={set("phone")} className="input" />
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" value={form.email ?? ""} onChange={set("email")} className="input" />
      </div>
      <div>
        <label className="label">GSTIN</label>
        <input maxLength={15} value={form.gstin ?? ""} onChange={set("gstin")} className="input uppercase" />
      </div>
      <div>
        <label className="label">State</label>
        <select value={form.state} onChange={set("state")} className="input">
          {INDIAN_STATES.map((s) => (
            <option key={s.code} value={s.name}>{s.code} - {s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Address</label>
        <input value={form.address ?? ""} onChange={set("address")} className="input" />
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{error}</p>}
      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
        <button disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving..." : isEdit ? "Save Vendor" : "Add Vendor"}
        </button>
        {isEdit && (
          <>
            <button type="button" onClick={onDone} className="btn-secondary">Close</button>
            <button type="button" onClick={remove} className="btn-danger">Delete</button>
          </>
        )}
      </div>
    </form>
  );
}

export function VendorEditToggle({ vendor, defaultState }: { vendor: VendorFormData; defaultState: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-medium text-brand-primary hover:underline">
        Edit
      </button>
    );
  }
  return (
    <div className="mt-3 rounded-lg border border-sky-100 bg-brand-pale p-3">
      <VendorForm initial={vendor} defaultState={defaultState} onDone={() => setOpen(false)} />
    </div>
  );
}
