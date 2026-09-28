import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseISTDate } from "@/lib/billing";
import { computeInvoice, round2 } from "@/lib/gst";
import { getSettings } from "@/lib/settings";
import { purchaseSchema } from "@/lib/validation";

type Tx = Prisma.TransactionClient;
export type PurchaseInput = z.infer<typeof purchaseSchema>;

// Take a purchase bill's items back out of stock (before editing or deleting it).
async function reverseStock(tx: Tx, purchaseBillId: string) {
  const old = await tx.purchaseItem.findMany({ where: { purchaseBillId } });
  for (const item of old) {
    if (!item.productId) continue;
    await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
  }
  await tx.stockMovement.deleteMany({ where: { purchaseBillId } });
  await tx.purchaseItem.deleteMany({ where: { purchaseBillId } });
}

async function resolveVendor(tx: Tx, input: PurchaseInput) {
  // The state decides CGST+SGST vs IGST, so a state changed on the bill is kept on the vendor.
  if (input.vendorId) {
    await tx.vendor.update({ where: { id: input.vendorId }, data: { state: input.vendor.state } });
    return input.vendorId;
  }
  const v = input.vendor;
  const existing = await tx.vendor.findFirst({
    where: { name: { equals: v.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await tx.vendor.create({
    data: {
      name: v.name,
      phone: v.phone || null,
      gstin: v.gstin ? v.gstin.toUpperCase() : null,
      address: v.address || null,
      state: v.state,
    },
  });
  return created.id;
}

// Creates a purchase bill, or replaces an existing one's contents when `id` is given.
// Items linked to a product add to its stock and move its cost to the weighted average
// of stock on hand and this purchase (cost excludes GST, which is claimed back as ITC).
export async function savePurchase(input: PurchaseInput, id?: string) {
  const settings = await getSettings();
  const interState = input.vendor.state !== settings.state;
  const calc = computeInvoice(input.items, input.pricesIncTax, interState);

  return prisma.$transaction(
    async (tx) => {
      if (id) await reverseStock(tx, id);
      const vendorId = await resolveVendor(tx, input);

      const data = {
        vendorId,
        billNumber: input.billNumber || null,
        billDate: parseISTDate(input.billDate),
        dueDate: input.dueDate ? parseISTDate(input.dueDate) : null,
        interState,
        pricesIncTax: input.pricesIncTax,
        taxableTotal: calc.taxableTotal,
        cgst: calc.cgst,
        sgst: calc.sgst,
        igst: calc.igst,
        roundOff: calc.roundOff,
        total: calc.total,
        amountPaid: Math.min(input.amountPaid, calc.total),
        paymentMode: input.paymentMode || null,
        notes: input.notes || null,
      };
      const bill = id ? await tx.purchaseBill.update({ where: { id }, data }) : await tx.purchaseBill.create({ data });
      const vendor = await tx.vendor.findUniqueOrThrow({ where: { id: vendorId }, select: { name: true } });

      for (const [idx, item] of input.items.entries()) {
        const line = calc.lines[idx];
        await tx.purchaseItem.create({
          data: {
            purchaseBillId: bill.id,
            productId: item.productId || null,
            name: item.name,
            hsnCode: item.hsnCode || null,
            unit: item.unit,
            quantity: item.quantity,
            rate: item.rate,
            discountPct: item.discountPct,
            gstRate: item.gstRate,
            ...line,
          },
        });
        if (!item.productId) continue;

        const unitCost = round2(line.taxableValue / item.quantity);
        const p = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        const onHand = p.costPrice > 0 ? Math.max(p.stock, 0) : 0;
        const costPrice = onHand > 0 ? round2((onHand * p.costPrice + item.quantity * unitCost) / (onHand + item.quantity)) : unitCost;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, costPrice },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "PURCHASE",
            change: item.quantity,
            unitCost,
            note: `Purchase from ${vendor.name}${bill.billNumber ? ` (bill ${bill.billNumber})` : ""}`,
            purchaseBillId: bill.id,
          },
        });
      }
      return bill;
    },
    { timeout: 30000 }
  );
}

export async function deletePurchase(id: string) {
  await prisma.$transaction(
    async (tx) => {
      await reverseStock(tx, id);
      await tx.purchaseBill.delete({ where: { id } });
    },
    { timeout: 30000 }
  );
}

export function purchaseStatus(bill: { total: number; amountPaid: number; dueDate: Date | null }) {
  if (bill.amountPaid >= bill.total - 0.005) return "PAID";
  if (bill.dueDate && bill.dueDate.getTime() < Date.now()) return "OVERDUE";
  return bill.amountPaid > 0 ? "PARTIAL" : "DUE";
}

// Items and vendors for the purchase form pickers.
export async function loadPurchaseFormData() {
  const [products, vendors, settings] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, hsnCode: true, gstRate: true, price: true, costPrice: true, unit: true, stock: true },
      orderBy: { name: "asc" },
    }),
    prisma.vendor.findMany({
      select: { id: true, name: true, phone: true, gstin: true, address: true, state: true },
      orderBy: { name: "asc" },
    }),
    getSettings(),
  ]);
  return { products, vendors, businessState: settings.state };
}
