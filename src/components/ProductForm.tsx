"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GST_RATES, round2 } from "@/lib/gst";
import { resizeImage } from "@/lib/resizeImage";

type Category = { id: string; name: string };

type ProductFormData = {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  costPrice: number;
  hsnCode: string | null;
  gstRate: number;
  lowStockAt: number;
  unit: string;
  stock: number;
  imageUrl?: string | null;
  featured: boolean;
  categoryId: string;
};

export default function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: ProductFormData;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(
    initial || {
      name: "",
      slug: "",
      brand: "",
      description: "",
      price: 0,
      costPrice: 0,
      hsnCode: "",
      gstRate: 18,
      lowStockAt: 5,
      unit: "piece",
      stock: 0,
      imageUrl: null,
      featured: false,
      categoryId: categories[0]?.id || "",
    }
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initial?.id;

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const margin = form.price > 0 && form.costPrice > 0 ? round2(((form.price - form.costPrice) / form.price) * 100) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      price: Number(form.price),
      costPrice: Number(form.costPrice),
      stock: Number(form.stock),
      lowStockAt: Number(form.lowStockAt),
      imageUrl: removePhoto ? null : form.imageUrl ?? null,
    };
    const res = await fetch(isEdit ? `/api/products/${initial!.id}` : "/api/products", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const fieldErrors = json.error?.fieldErrors ? Object.entries(json.error.fieldErrors).map(([k, v]) => `${k}: ${(v as string[])[0]}`) : [];
      setError(fieldErrors[0] || json.error?.formErrors?.[0] || (typeof json.error === "string" ? json.error : "Could not save product."));
      setSaving(false);
      return;
    }
    const { product } = await res.json();

    if (photo) {
      try {
        const blob = await resizeImage(photo);
        const up = await fetch(`/api/products/${product.id}/image`, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: blob,
        });
        if (!up.ok) throw new Error((await up.json().catch(() => ({}))).error || "Upload failed");
      } catch (err) {
        setError(`Product saved, but the photo didn't upload: ${err instanceof Error ? err.message : err}`);
        setSaving(false);
        router.replace(`/admin/products/${product.id}/edit`);
        return;
      }
    } else if (removePhoto && isEdit) {
      await fetch(`/api/products/${product.id}/image`, { method: "DELETE" });
    }

    router.push("/admin/products");
    router.refresh();
  };

  const num = (key: keyof ProductFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: Number(e.target.value) }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4 p-6">
        <h2 className="font-bold text-brand-navy">Item details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Item Name *">
            <input
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: isEdit ? f.slug : slugify(name) }));
              }}
              className="input"
            />
          </Field>
          <Field label="Slug (web address) *">
            <input
              required
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              className="input"
            />
          </Field>
          <Field label="Brand *">
            <input required value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="input" />
          </Field>
          <Field label="Category *">
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="input"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Unit *">
            <input required value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="input" placeholder="piece, set, pair, roll..." />
          </Field>
          <Field label="HSN Code" hint="Printed on GST bills. Most auto parts fall under 8708 / 8512 / 8536.">
            <input value={form.hsnCode ?? ""} onChange={(e) => setForm((f) => ({ ...f, hsnCode: e.target.value }))} className="input" />
          </Field>
        </div>
        <Field label="Description *">
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="input"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
          />
          Feature this item on the homepage
        </label>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-bold text-brand-navy">Price, tax &amp; stock</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Selling Price (Rs) *" hint="Shown on the website, and the default rate on bills (incl. GST).">
            <input required type="number" min={0} step="0.01" value={form.price} onChange={num("price")} className="input" />
          </Field>
          <Field
            label="Purchase / Cost Price (Rs)"
            hint={margin !== null ? `Margin ${margin}% of selling price. Admin only, never shown to customers.` : "Admin only, used for profit reports."}
          >
            <input type="number" min={0} step="0.01" value={form.costPrice} onChange={num("costPrice")} className="input" />
          </Field>
          <Field label="GST Rate">
            <select value={form.gstRate} onChange={num("gstRate")} className="input">
              {GST_RATES.map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
          </Field>
          {isEdit ? (
            <Field label="Current Stock" hint="Change stock from the Stock page so every change is recorded.">
              <input disabled value={form.stock} className="input bg-slate-50 text-slate-500" />
            </Field>
          ) : (
            <Field label="Opening Stock *">
              <input required type="number" min={0} value={form.stock} onChange={num("stock")} className="input" />
            </Field>
          )}
          <Field label="Low-stock Alert At" hint="Flag the item when stock falls to this number.">
            <input type="number" min={0} value={form.lowStockAt} onChange={num("lowStockAt")} className="input" />
          </Field>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-bold text-brand-navy">Photo</h2>
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-lg border border-sky-100 bg-brand-light">
            {preview && !removePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Item photo" className="h-full w-full object-cover" />
            ) : (
              <span className="px-3 text-center text-xs text-slate-400">No photo</span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <label className="btn-secondary cursor-pointer px-4 py-2">
              {preview && !removePhoto ? "Change Photo" : "Upload Photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhoto(file);
                    setRemovePhoto(false);
                  }
                }}
              />
            </label>
            {preview && !removePhoto && (
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setRemovePhoto(true);
                }}
                className="block text-sm font-medium text-red-600 hover:underline"
              >
                Remove photo
              </button>
            )}
            <p className="text-xs text-slate-500">JPG, PNG or WebP. Large photos are resized automatically.</p>
          </div>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
        {saving ? "Saving..." : isEdit ? "Update Item" : "Create Item"}
      </button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
