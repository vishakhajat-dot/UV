"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchSelect, { SearchOption } from "./SearchSelect";
import LineItemsEditor, { BillProduct, BillRow, blankRow, nextRowKey } from "./LineItemsEditor";
import { uploadAttachment } from "./AttachmentsPanel";
import { INDIAN_STATES, computeInvoice, formatINR, round2 } from "@/lib/gst";

export type PurchaseVendor = {
  id: string;
  name: string;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  state: string;
};

type VendorFields = Omit<PurchaseVendor, "id">;

export type PurchaseInitial = {
  id: string;
  vendorId: string;
  vendor: VendorFields;
  billNumber: string | null;
  billDate: string;
  dueDate: string | null;
  pricesIncTax: boolean;
  items: Omit<BillRow, "key">[];
  amountPaid: number;
  paymentMode: string | null;
  notes: string | null;
};

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"];

export default function PurchaseForm({
  products,
  vendors,
  businessState,
  today,
  initial,
}: {
  products: BillProduct[];
  vendors: PurchaseVendor[];
  businessState: string;
  today: string;
  initial?: PurchaseInitial;
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const [vendorId, setVendorId] = useState<string | null>(initial?.vendorId ?? null);
  const [vendor, setVendor] = useState<VendorFields>(
    initial?.vendor ?? { name: "", phone: "", gstin: "", address: "", state: businessState }
  );
  const [billNumber, setBillNumber] = useState(initial?.billNumber ?? "");
  const [billDate, setBillDate] = useState(initial?.billDate ?? today);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [pricesIncTax, setPricesIncTax] = useState(initial?.pricesIncTax ?? false);
  const [rows, setRows] = useState<BillRow[]>(
    initial?.items.length ? initial.items.map((i) => ({ ...i, key: nextRowKey() })) : [blankRow()]
  );
  const [amountPaid, setAmountPaid] = useState<number | "">(initial?.amountPaid ?? "");
  const [paymentMode, setPaymentMode] = useState(initial?.paymentMode ?? "Cash");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendorOptions: SearchOption[] = useMemo(
    () =>
      vendors.map((v) => ({
        id: v.id,
        label: v.name,
        hint: [v.phone, v.gstin].filter(Boolean).join(" · "),
        search: `${v.name} ${v.phone ?? ""} ${v.gstin ?? ""}`.toLowerCase(),
      })),
    [vendors]
  );

  const interState = vendor.state !== businessState;
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

  const setField = <K extends keyof VendorFields>(key: K, value: VendorFields[K]) => setVendor((v) => ({ ...v, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const items = rows.filter((r) => r.name.trim());
    if (items.length === 0) {
      setError("Add at least one item.");
      return;
    }
    setSaving(true);
    const res = await fetch(isEdit ? `/api/purchases/${initial!.id}` : "/api/purchases", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId,
        vendor,
        billNumber,
        billDate,
        dueDate: dueDate || null,
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
      setError(json.error || "Could not save the purchase.");
      setSaving(false);
      return;
    }
    const id = json.purchase.id as string;
    const problems: string[] = [];
    for (const file of files) {
      try {
        await uploadAttachment(id, file);
      } catch (err) {
        problems.push(err instanceof Error ? err.message : String(err));
      }
    }
    if (problems.length) alert(`Purchase saved, but some files didn't upload:\n${problems.join("\n")}`);
    router.push(`/admin/purchases/${id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card p-5">
        <h2 className="text-lg font-bold text-brand-navy">Vendor &amp; Bill</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="label">Vendor Name *</label>
            <SearchSelect
              required
              value={vendor.name}
              options={vendorOptions}
              placeholder="Search saved vendors or type a new one"
              onChange={(name) => {
                setField("name", name);
                setVendorId(null);
              }}
              onPick={(o) => {
                const v = vendors.find((x) => x.id === o.id)!;
                setVendorId(v.id);
                setVendor({ name: v.name, phone: v.phone ?? "", gstin: v.gstin ?? "", address: v.address ?? "", state: v.state });
              }}
            />
            <p className="mt-1 text-xs text-slate-500">
              {vendorId ? "Saved vendor." : "New vendors are saved automatically."}
            </p>
          </div>
          <div>
            <label className="label">Vendor Phone</label>
            <input value={vendor.phone ?? ""} disabled={!!vendorId} onChange={(e) => setField("phone", e.target.value)} className="input disabled:bg-slate-50" />
          </div>
          <div>
            <label className="label">Vendor GSTIN</label>
            <input
              value={vendor.gstin ?? ""}
              maxLength={15}
              disabled={!!vendorId}
              onChange={(e) => setField("gstin", e.target.value.toUpperCase())}
              className="input uppercase disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="label">Vendor State</label>
            <select value={vendor.state} onChange={(e) => setField("state", e.target.value)} className="input">
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vendor&apos;s Bill No.</label>
            <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Bill Date *</label>
              <input type="date" required value={billDate} onChange={(e) => setBillDate(e.target.value)} className="input px-2" />
            </div>
            <div>
              <label className="label">Pay By</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input px-2" />
            </div>
          </div>
        </div>
        <p className="mt-3 inline-block rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-navy">
          {interState ? "Other state: IGST" : "Same state: CGST + SGST"}
        </p>
      </section>

      <LineItemsEditor
        mode="purchase"
        rows={rows}
        setRows={setRows}
        products={products}
        lines={calc.lines}
        pricesIncTax={pricesIncTax}
        setPricesIncTax={setPricesIncTax}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4 p-5">
          <h2 className="text-lg font-bold text-brand-navy">Payment to vendor</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Amount Paid (Rs)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))}
                  className="input"
                  placeholder="0 if not paid yet"
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
            <label className="label">Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
          </div>
          {!isEdit && (
            <div>
              <label className="label">Attach vendor bill / receipt</label>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-light file:px-3 file:py-2 file:font-medium file:text-brand-navy"
              />
              <p className="mt-1 text-xs text-slate-500">Photos or PDFs. You can add more later.</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-bold text-brand-navy">Summary</h2>
          <dl className="tabular mt-3 space-y-2 text-sm">
            <Row label="Taxable Amount" value={formatINR(calc.taxableTotal)} />
            {interState ? (
              <Row label="IGST (input credit)" value={formatINR(calc.igst)} />
            ) : (
              <>
                <Row label="CGST (input credit)" value={formatINR(calc.cgst)} />
                <Row label="SGST (input credit)" value={formatINR(calc.sgst)} />
              </>
            )}
            <Row label="Round Off" value={(calc.roundOff > 0 ? "+" : "") + calc.roundOff.toFixed(2)} />
            <div className="flex items-center justify-between rounded-lg bg-brand-navy px-3 py-2.5 text-base font-bold text-white">
              <span>Bill Total</span>
              <span>{formatINR(calc.total)}</span>
            </div>
            <Row label="Still to Pay" value={formatINR(Math.max(round2(calc.total - (Number(amountPaid) || 0)), 0))} />
          </dl>
          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary mt-5 w-full py-3 text-base disabled:opacity-60">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Purchase"}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            {isEdit ? "Stock is corrected to match the edited items." : "Items picked from your list are added to stock."}
          </p>
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
