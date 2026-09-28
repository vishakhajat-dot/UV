import { todayYmd } from "@/lib/dates";
import { loadPurchaseFormData } from "@/lib/purchases";
import PurchaseForm from "@/components/admin/PurchaseForm";

export const revalidate = 0;

export default async function NewPurchasePage() {
  const data = await loadPurchaseFormData();
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">New Purchase</h1>
      <p className="text-sm text-slate-500">Enter a bill you received from a vendor.</p>
      <div className="mt-6">
        <PurchaseForm {...data} today={todayYmd()} />
      </div>
    </div>
  );
}
