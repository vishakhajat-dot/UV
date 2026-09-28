"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchSelect, { SearchOption } from "./SearchSelect";
import LineItemsEditor, { BillProduct, BillRow, blankRow, nextRowKey } from "./LineItemsEditor";
import { INDIAN_STATES, computeInvoice, formatINR, round2 } from "@/lib/gst";

export type BillCustomer = {
  id: string;
  name: string;
  businessName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  state: string;
  gstin: string | null;
};

export type { BillProduct, BillRow };

type CustomerFields = Omit<BillCustomer, "id" | "phone"> & { phone: string };

export type InvoicePrefill = {
  customerId?: string | null;
  customer?: CustomerFields;
  items?: Omit<BillRow, "key">[];
  orderId?: string | null;
  notes?: string;
};

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Credit (pay later)"];

const emptyCustomer = (state: string): CustomerFields => ({
  name: "",
  businessName: "",
  phone: "",
  email: "",
  address: "",
  state,
  gstin: "",
});

export default function InvoiceForm({
  products,
  customers,
  businessState,
  today,
  prefill,
}: {
  products: BillProduct[];
  customers: BillCustomer[];
  businessState: string;
  today: string;
  prefill?: InvoicePrefill;
}) {
  const router = useRouter();
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [customerId, setCustomerId] = useState<string | null>(prefill?.customerId ?? null);
  const [customer, setCustomer] = useState<CustomerFields>(prefill?.customer ?? emptyCustomer(businessState));
  const [saveCustomer, setSaveCustomer] = useState(true);
  const [pricesIncTax, setPricesIncTax] = useState(true);
  const [rows, setRows] = useState<BillRow[]>(
    prefill?.items?.length ? prefill.items.map((i) => ({ ...i, key: nextRowKey() })) : [blankRow()]
  );
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerOptions: SearchOption[] = useMemo(
    () =>
      customers.map((c) => ({
        id: c.id,
        label: c.businessName ? `${c.businessName} (${c.name})` : c.name,
        hint: [c.phone, c.gstin].filter(Boolean).join(" · "),
        search: `${c.name} ${c.businessName ?? ""} ${c.phone} ${c.gstin ?? ""}`.toLowerCase(),
      })),
    [customers]
  );

  const interState = customer.state !== businessState;
  const calc = computeInvoice(
    rows.map((r) => ({
      quantity: Number(r.quantity) || 0,
      rate: Number(r.rate) || 0,
      discountPct: Number(r.discountPct) || 0,
      gstRate: r.gstRate,
    })),
    pricesIncTax,
    interState
  );

  const setField = <K extends keyof CustomerFields>(key: K, value: CustomerFields[K]) =>
    setCustomer((c) => ({ ...c, [key]: value }));

  const pickCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setCustomerId(c.id);
    setCustomer({
      name: c.name,
      businessName: c.businessName ?? "",
      phone: c.phone,
      email: c.email ?? "",
      address: c.address ?? "",
      state: c.state,
      gstin: c.gstin ?? "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const items = rows.filter((r) => r.name.trim());
    if (items.length === 0) {
      setError("Add at least one item to the bill.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/billing/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceDate,
        customerId,
        saveCustomer,
        customer,
        orderId: prefill?.orderId ?? null,
        pricesIncTax,
        items: items.map((r) => ({
          productId: r.productId,
          name: r.name,
          hsnCode: r.hsnCode,
          unit: r.unit,
          quantity: Number(r.quantity),
          rate: Number(r.rate),
          discountPct: Number(r.discountPct) || 0,
          gstRate: r.gstRate,
        })),
        amountPaid: Number(amountPaid) || 0,
        paymentMode: Number(amountPaid) > 0 ? paymentMode : null,
        notes,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Could not save the bill.");
      setSaving(false);
      return;
    }
    router.push(`/admin/billing/${json.invoice.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer */}
      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-bold text-brand-navy">Bill To</h2>
          <div>
            <label className="label">Bill Date</label>
            <input type="date" required value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="input" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="label">Customer Name *</label>
            <SearchSelect
              required
              value={customer.name}
              options={customerOptions}
              placeholder="Search saved customers or type a new name"
              onChange={(name) => {
                setField("name", name);
                setCustomerId(null);
              }}
              onPick={(o) => pickCustomer(o.id)}
            />
            {customerId ? (
              <p className="mt-1 text-xs text-emerald-700">
                Saved customer.{" "}
                <button
                  type="button"
                  className="font-medium text-brand-primary hover:underline"
                  onClick={() => {
                    setCustomerId(null);
                    setCustomer(emptyCustomer(businessState));
                  }}
                >
                  Clear
                </button>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Pick from the list, or type a new customer.</p>
            )}
          </div>
          <div>
            <label className="label">Business / Shop Name</label>
            <input value={customer.businessName ?? ""} onChange={(e) => setField("businessName", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              value={customer.phone}
              inputMode="tel"
              onChange={(e) => setField("phone", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={customer.email ?? ""} onChange={(e) => setField("email", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Customer GSTIN</label>
            <input
              value={customer.gstin ?? ""}
              maxLength={15}
              placeholder="Leave blank for unregistered"
              onChange={(e) => setField("gstin", e.target.value.toUpperCase())}
              className="input uppercase"
            />
          </div>
          <div>
            <label className="label">State (Place of Supply)</label>
            <select value={customer.state} onChange={(e) => setField("state", e.target.value)} className="input">
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Address</label>
            <input value={customer.address ?? ""} onChange={(e) => setField("address", e.target.value)} className="input" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {!customerId && (
            <label className="flex items-center gap-2 text-slate-700">
              <input type="checkbox" checked={saveCustomer} onChange={(e) => setSaveCustomer(e.target.checked)} />
              Save to customer list (needs a phone number)
            </label>
          )}
          <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-navy">
            {interState ? "Other state: IGST applies" : "Same state: CGST + SGST applies"}
          </span>
        </div>
      </section>

      <LineItemsEditor
        mode="sale"
        rows={rows}
        setRows={setRows}
        products={products}
        lines={calc.lines}
        pricesIncTax={pricesIncTax}
        setPricesIncTax={setPricesIncTax}
      />

      {/* Totals & payment */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4 p-5">
          <h2 className="text-lg font-bold text-brand-navy">Payment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Amount Received (Rs)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))}
                  className="input"
                  placeholder="0"
                />
                <button type="button" onClick={() => setAmountPaid(calc.total)} className="btn-secondary shrink-0 px-3 py-2">
                  Full
                </button>
              </div>
            </div>
            <div>
              <label className="label">Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="input">
                {PAYMENT_MODES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes on bill (optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="Vehicle no., delivery details, etc." />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-bold text-brand-navy">Summary</h2>
          <dl className="tabular mt-3 space-y-2 text-sm">
            <Row label="Taxable Amount" value={formatINR(calc.taxableTotal)} />
            {interState ? (
              <Row label="IGST" value={formatINR(calc.igst)} />
            ) : (
              <>
                <Row label="CGST" value={formatINR(calc.cgst)} />
                <Row label="SGST" value={formatINR(calc.sgst)} />
              </>
            )}
            <Row label="Round Off" value={(calc.roundOff > 0 ? "+" : "") + calc.roundOff.toFixed(2)} />
            <div className="flex items-center justify-between rounded-lg bg-brand-primary px-3 py-2.5 text-base font-bold text-white">
              <span>Grand Total</span>
              <span>{formatINR(calc.total)}</span>
            </div>
            <Row label="Balance Due" value={formatINR(Math.max(round2(calc.total - (Number(amountPaid) || 0)), 0))} />
          </dl>

          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary mt-5 w-full py-3 text-base disabled:opacity-60">
            {saving ? "Saving bill..." : "Save Bill"}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">Saving reduces stock for items picked from your list.</p>
        </div>
      </section>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-1">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-semibold text-brand-navy">{value}</dd>
    </div>
  );
}
