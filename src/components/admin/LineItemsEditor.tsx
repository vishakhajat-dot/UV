"use client";

import { useMemo } from "react";
import SearchSelect, { SearchOption } from "./SearchSelect";
import { GST_RATES, LineResult, formatINR } from "@/lib/gst";

export type BillProduct = {
  id: string;
  name: string;
  hsnCode: string | null;
  gstRate: number;
  price: number;
  costPrice?: number;
  unit: string;
  stock: number;
};

export type BillRow = {
  key: number;
  productId: string | null;
  name: string;
  hsnCode: string;
  unit: string;
  quantity: number;
  rate: number;
  discountPct: number;
  gstRate: number;
};

let rowKey = 1;
export const nextRowKey = () => rowKey++;
export const blankRow = (): BillRow => ({
  key: nextRowKey(),
  productId: null,
  name: "",
  hsnCode: "",
  unit: "piece",
  quantity: 1,
  rate: 0,
  discountPct: 0,
  gstRate: 18,
});

// Item rows shared by sales bills and purchase bills. In "purchase" mode picking an
// item fills in its cost price and the hint shows how much stock it will add.
export default function LineItemsEditor({
  mode,
  rows,
  setRows,
  products,
  lines,
  pricesIncTax,
  setPricesIncTax,
}: {
  mode: "sale" | "purchase";
  rows: BillRow[];
  setRows: React.Dispatch<React.SetStateAction<BillRow[]>>;
  products: BillProduct[];
  lines: LineResult[];
  pricesIncTax: boolean;
  setPricesIncTax: (v: boolean) => void;
}) {
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const options: SearchOption[] = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.name,
        hint:
          mode === "sale"
            ? `${formatINR(p.price)} / ${p.unit} · GST ${p.gstRate}% · ${p.stock} in stock`
            : `Last cost ${p.costPrice ? formatINR(p.costPrice) : "not set"} · ${p.stock} in stock`,
        search: `${p.name} ${p.hsnCode ?? ""}`.toLowerCase(),
      })),
    [products, mode]
  );

  const updateRow = (key: number, patch: Partial<BillRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-navy">Items</h2>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={pricesIncTax} onChange={(e) => setPricesIncTax(e.target.checked)} />
          Rates include GST
        </label>
      </div>

      <div className="mt-4 hidden grid-cols-12 gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        <span className="col-span-4">Item</span>
        <span className="col-span-1">HSN</span>
        <span className="col-span-1">Qty</span>
        <span className="col-span-2">{mode === "sale" ? "Rate (Rs)" : "Cost Rate (Rs)"}</span>
        <span className="col-span-1">Disc %</span>
        <span className="col-span-1">GST %</span>
        <span className="col-span-2 text-right">Amount</span>
      </div>

      <div className="mt-2 space-y-3">
        {rows.map((row, idx) => {
          const product = row.productId ? productById.get(row.productId) : undefined;
          const short = mode === "sale" && product && row.quantity > product.stock;
          return (
            <div key={row.key} className="grid grid-cols-2 gap-2 rounded-lg border border-sky-100 p-3 md:grid-cols-12 md:items-start md:border-0 md:p-1">
              <div className="col-span-2 md:col-span-4">
                <SearchSelect
                  value={row.name}
                  options={options}
                  placeholder={`Item ${idx + 1} - search or type`}
                  onChange={(name) => updateRow(row.key, { name, productId: null })}
                  onPick={(o) => {
                    const p = productById.get(o.id)!;
                    updateRow(row.key, {
                      productId: p.id,
                      name: p.name,
                      hsnCode: p.hsnCode ?? "",
                      unit: p.unit,
                      rate: mode === "sale" ? p.price : p.costPrice ?? 0,
                      gstRate: p.gstRate,
                    });
                  }}
                />
                {product ? (
                  <p className={`mt-1 text-xs ${short ? "font-semibold text-amber-700" : "text-slate-500"}`}>
                    {mode === "purchase"
                      ? `Adds ${row.quantity || 0} to stock (now ${product.stock})`
                      : short
                        ? `Only ${product.stock} in stock`
                        : `${product.stock} ${product.unit} in stock`}
                  </p>
                ) : (
                  row.name && mode === "purchase" && <p className="mt-1 text-xs text-slate-500">Not a stock item (expense only)</p>
                )}
              </div>
              <Cell label="HSN" className="md:col-span-1">
                <input value={row.hsnCode} onChange={(e) => updateRow(row.key, { hsnCode: e.target.value })} className="input px-2" />
              </Cell>
              <Cell label="Qty" className="md:col-span-1">
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={row.quantity}
                  onChange={(e) => updateRow(row.key, { quantity: Number(e.target.value) })}
                  className="input px-2"
                />
              </Cell>
              <Cell label={mode === "sale" ? "Rate (Rs)" : "Cost Rate (Rs)"} className="md:col-span-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={row.rate}
                  onChange={(e) => updateRow(row.key, { rate: Number(e.target.value) })}
                  className="input px-2"
                />
              </Cell>
              <Cell label="Disc %" className="md:col-span-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={row.discountPct}
                  onChange={(e) => updateRow(row.key, { discountPct: Number(e.target.value) })}
                  className="input px-2"
                />
              </Cell>
              <Cell label="GST %" className="md:col-span-1">
                <select value={row.gstRate} onChange={(e) => updateRow(row.key, { gstRate: Number(e.target.value) })} className="input px-2">
                  {GST_RATES.map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
              </Cell>
              <div className="col-span-2 flex items-center justify-between gap-2 md:col-span-2 md:justify-end md:pt-2">
                <span className="tabular font-semibold text-brand-navy">{formatINR(lines[idx]?.lineTotal ?? 0)}</span>
                <button
                  type="button"
                  aria-label="Remove item"
                  disabled={rows.length === 1}
                  onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                  className="rounded-md px-2 py-1 text-lg leading-none text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  &times;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={() => setRows((rs) => [...rs, blankRow()])} className="btn-secondary mt-4 px-4 py-2">
        + Add Item
      </button>
    </section>
  );
}

function Cell({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <span className="mb-1 block text-xs font-medium text-slate-500 md:hidden">{label}</span>
      {children}
    </div>
  );
}
