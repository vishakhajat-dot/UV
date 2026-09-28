import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { todayYmd } from "@/lib/dates";
import { loadPurchaseFormData } from "@/lib/purchases";
import PurchaseForm from "@/components/admin/PurchaseForm";

export const revalidate = 0;

// "YYYY-MM-DD" in India time, for date inputs.
const ymd = (d: Date) => new Date(d.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

export default async function EditPurchasePage({ params }: { params: { id: string } }) {
  const [bill, data] = await Promise.all([
    prisma.purchaseBill.findUnique({
      where: { id: params.id },
      include: { vendor: true, items: { orderBy: { id: "asc" } } },
    }),
    loadPurchaseFormData(),
  ]);
  if (!bill) notFound();

  return (
    <div>
      <Link href={`/admin/purchases/${bill.id}`} className="text-sm text-brand-primary hover:underline">&larr; Back to purchase</Link>
      <h1 className="mt-1 text-2xl font-bold text-brand-navy">Edit Purchase</h1>
      <div className="mt-6">
        <PurchaseForm
          {...data}
          today={todayYmd()}
          initial={{
            id: bill.id,
            vendorId: bill.vendorId,
            vendor: {
              name: bill.vendor.name,
              phone: bill.vendor.phone,
              gstin: bill.vendor.gstin,
              address: bill.vendor.address,
              state: bill.vendor.state,
            },
            billNumber: bill.billNumber,
            billDate: ymd(bill.billDate),
            dueDate: bill.dueDate ? ymd(bill.dueDate) : null,
            pricesIncTax: bill.pricesIncTax,
            items: bill.items.map((i) => ({
              productId: i.productId,
              name: i.name,
              hsnCode: i.hsnCode ?? "",
              unit: i.unit,
              quantity: i.quantity,
              rate: i.rate,
              discountPct: i.discountPct,
              gstRate: i.gstRate,
            })),
            amountPaid: bill.amountPaid,
            paymentMode: bill.paymentMode,
            notes: bill.notes,
          }}
        />
      </div>
    </div>
  );
}
