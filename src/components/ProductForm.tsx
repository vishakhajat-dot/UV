"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };

type ProductFormData = {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
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
      unit: "piece",
      stock: 0,
      imageUrl: "",
      featured: false,
      categoryId: categories[0]?.id || "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initial?.id;

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    const res = await fetch(isEdit ? `/api/products/${initial!.id}` : "/api/products", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error?.formErrors?.[0] || json.error || "Could not save product.");
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product Name *">
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
        <Field label="Slug (URL) *">
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
        <Field label="Price (Rs) *" hint="Only visible/editable here in the admin panel — customers never set or override it.">
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            className="input"
          />
        </Field>
        <Field label="Unit *">
          <input required value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="input" placeholder="piece, set, pair, roll..." />
        </Field>
        <Field label="Stock Quantity *">
          <input
            required
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
            className="input"
          />
        </Field>
        <Field label="Image URL (optional)">
          <input value={form.imageUrl || ""} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className="input" />
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

      <label className="flex items-center gap-2 text-sm dark:text-gray-200">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
        />
        Feature this product on the homepage
      </label>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
        {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
      </button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}
