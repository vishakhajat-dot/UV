"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INDIAN_STATES } from "@/lib/gst";
import type { BusinessSettingsData } from "@/lib/settings";

export default function SettingsForm({ initial }: { initial: BusinessSettingsData }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (key: keyof BusinessSettingsData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    setMessage(res.ok ? { ok: true, text: "Saved. New bills will use these details." } : { ok: false, text: json.error || "Could not save." });
    if (res.ok) router.refresh();
  };

  const text = (key: keyof BusinessSettingsData, label: string, opts: { required?: boolean; hint?: string; type?: string } = {}) => (
    <div>
      <label className="label">{label}{opts.required && " *"}</label>
      <input type={opts.type ?? "text"} required={opts.required} value={(form[key] as string) ?? ""} onChange={set(key)} className="input" />
      {opts.hint && <p className="mt-1 text-xs text-slate-500">{opts.hint}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-brand-navy">Printed on every bill</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("businessName", "Business Name", { required: true })}
          {text("gstin", "Your GSTIN", { hint: "15 characters. Leave blank if not registered yet." })}
          {text("ownerName", "Name on Bill", { required: true, hint: "Printed in the header and above the signature." })}
          {text("ownerEmail", "Email on Bill", { required: true, type: "email" })}
          {text("phone", "Phone", { required: true })}
          <div>
            <label className="label">State *</label>
            <select value={form.state} onChange={set("state")} className="input">
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>{s.code} - {s.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Customers in this state get CGST + SGST; others get IGST.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address *</label>
            <input required value={form.address} onChange={set("address")} className="input" />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-brand-navy">Payment details (printed on bill)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("bankName", "Bank Name")}
          {text("accountNumber", "Account Number")}
          {text("ifsc", "IFSC")}
          {text("upiId", "UPI ID")}
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-brand-navy">Bill numbering &amp; terms</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("invoicePrefix", "Bill Number Prefix", {
            required: true,
            hint: `Bills are numbered ${form.invoicePrefix || "MAA"}/2026-27/0001 and restart each April.`,
          })}
        </div>
        <div>
          <label className="label">Terms &amp; Conditions</label>
          <textarea rows={3} value={form.terms ?? ""} onChange={set("terms")} className="input" />
        </div>
      </section>

      {message && <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>}
      <button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving..." : "Save Settings"}</button>
    </form>
  );
}
