"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchSelect from "./SearchSelect";

type StockProduct = { id: string; name: string; stock: number; unit: string; costPrice: number };

export default function StockEntryForm({ products, initialProductId }: { products: StockProduct[]; initialProductId?: string }) {
  const router = useRouter();
  const initial = products.find((p) => p.id === initialProductId);
  const [productId, setProductId] = useState<string | null>(initial?.id ?? null);
  const [search, setSearch] = useState(initial?.name ?? "");
  const [type, setType] = useState<"PURCHASE" | "ADJUSTMENT">("PURCHASE");
  const [quantity, setQuantity] = useState<number | "">("");
  const [unitCost, setUnitCost] = useState<number | "">(initial?.costPrice || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const options = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.name,
        hint: `${p.stock} ${p.unit} in stock`,
        search: p.name.toLowerCase(),
      })),
    [products]
  );
  const product = products.find((p) => p.id === productId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setMessage({ ok: false, text: "Pick an item from the list." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        type,
        quantity: Number(quantity),
        unitCost: type === "PURCHASE" && unitCost !== "" ? Number(unitCost) : null,
        note,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage({ ok: false, text: json.error || "Could not save." });
      return;
    }
    setMessage({ ok: true, text: `Saved. ${product?.name} now has ${json.product.stock} in stock.` });
    setQuantity("");
    setNote("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="flex gap-2">
        {(["PURCHASE", "ADJUSTMENT"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${type === t ? "bg-brand-primary text-white" : "bg-brand-light text-brand-navy"}`}
          >
            {t === "PURCHASE" ? "Stock In (Purchase)" : "Adjust / Correct"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Item *</label>
          <SearchSelect
            required
            value={search}
            options={options}
            placeholder="Search items"
            onChange={(t) => {
              setSearch(t);
              setProductId(null);
            }}
            onPick={(o) => {
              const p = products.find((x) => x.id === o.id)!;
              setProductId(p.id);
              setSearch(p.name);
              setUnitCost(p.costPrice || "");
            }}
          />
          {product && <p className="mt-1 text-xs text-slate-500">Currently {product.stock} {product.unit} in stock</p>}
        </div>
        <div>
          <label className="label">{type === "PURCHASE" ? "Quantity Bought *" : "Change (+ or -) *"}</label>
          <input
            required
            type="number"
            step={1}
            min={type === "PURCHASE" ? 1 : undefined}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
            className="input"
            placeholder={type === "PURCHASE" ? "e.g. 50" : "e.g. -2 for damaged"}
          />
        </div>
        {type === "PURCHASE" ? (
          <div>
            <label className="label">Cost per Unit (Rs)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value === "" ? "" : Number(e.target.value))}
              className="input"
            />
          </div>
        ) : (
          <div />
        )}
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label">Note</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
            placeholder={type === "PURCHASE" ? "Supplier name, purchase bill no." : "Reason, e.g. damaged, stock count"}
          />
        </div>
      </div>
      {message && <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>}
      <button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving..." : "Save Stock Entry"}</button>
    </form>
  );
}
