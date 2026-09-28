import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR, round2 } from "@/lib/gst";
import { getSettings } from "@/lib/settings";
import { telLink } from "@/lib/whatsapp";
import VendorForm, { VendorEditToggle } from "@/components/admin/VendorForm";

export const revalidate = 0;

export default async function VendorsPage() {
  const [vendors, settings] = await Promise.all([
    prisma.vendor.findMany({
      include: { purchases: { select: { total: true, amountPaid: true } } },
      orderBy: { name: "asc" },
    }),
    getSettings(),
  ]);
  const rows = vendors.map((v) => {
    const bought = round2(v.purchases.reduce((s, p) => s + p.total, 0));
    const paid = round2(v.purchases.reduce((s, p) => s + p.amountPaid, 0));
    return { ...v, bought, owe: round2(bought - paid), bills: v.purchases.length };
  });
  const totalOwe = round2(rows.reduce((s, r) => s + r.owe, 0));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Vendors</h1>
          <p className="text-sm text-slate-500">
            {vendors.length} suppliers · you owe {formatINR(totalOwe)} in total
          </p>
        </div>
        <Link href="/admin/purchases/new" className="btn-primary">+ New Purchase</Link>
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-3 font-bold text-brand-navy">Add a vendor</h2>
        <VendorForm defaultState={settings.state} />
      </div>

      <div className="card mt-6 divide-y divide-sky-50">
        {rows.map((v) => (
          <div key={v.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/admin/purchases?vendor=${v.id}`} className="font-semibold text-brand-primary hover:underline">
                  {v.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {[v.phone, v.gstin && `GSTIN ${v.gstin}`, v.state].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="tabular flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-slate-600">{v.bills} bills · {formatINR(v.bought)}</span>
                <span className={`font-semibold ${v.owe > 0.5 ? "text-amber-700" : "text-slate-400"}`}>Owe {formatINR(v.owe)}</span>
                {v.phone && <a href={telLink(v.phone)} className="text-sm font-medium text-brand-primary hover:underline">Call</a>}
                <VendorEditToggle
                  defaultState={settings.state}
                  vendor={{ id: v.id, name: v.name, phone: v.phone, email: v.email, gstin: v.gstin, address: v.address, state: v.state, notes: v.notes }}
                />
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No vendors yet. They&apos;re also added automatically when you save a purchase.
          </p>
        )}
      </div>
    </div>
  );
}
