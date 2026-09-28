import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { computeInvoice, financialYear, round2 } from "@/lib/gst";
import { getSettings } from "@/lib/settings";
import { createInvoiceSchema } from "@/lib/validation";

type Tx = Prisma.TransactionClient;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// Parse "2026-09-28" as midday India time so the date never slips a day in UTC.
export function parseISTDate(ymd: string) {
  return new Date(`${ymd}T12:00:00+05:30`);
}

async function nextInvoiceNumber(tx: Tx, prefix: string, date: Date) {
  const base = `${prefix}/${financialYear(date)}/`;
  const last = await tx.invoice.findFirst({
    where: { invoiceNumber: { startsWith: base } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const n = last ? parseInt(last.invoiceNumber.slice(base.length), 10) + 1 : 1;
  return base + String(n).padStart(4, "0");
}

async function resolveCustomer(tx: Tx, input: CreateInvoiceInput) {
  if (input.customerId) return input.customerId;
  const c = input.customer;
  if (!input.saveCustomer || !c.phone) return null;
  const existing = await tx.customer.findFirst({ where: { phone: c.phone }, select: { id: true } });
  if (existing) return existing.id;
  const created = await tx.customer.create({
    data: {
      name: c.name,
      businessName: c.businessName || null,
      phone: c.phone,
      email: c.email || null,
      address: c.address || null,
      state: c.state,
      gstin: c.gstin ? c.gstin.toUpperCase() : null,
    },
  });
  return created.id;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const settings = await getSettings();
  const interState = input.customer.state !== settings.state;
  const date = parseISTDate(input.invoiceDate);

  const productIds = input.items.map((i) => i.productId).filter((id): id is string => !!id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, costPrice: true },
  });
  const costOf = new Map(products.map((p) => [p.id, p.costPrice]));
  if (costOf.size !== new Set(productIds).size) throw new Error("One or more items no longer exist.");

  const calc = computeInvoice(input.items, input.pricesIncTax, interState);
  const items = input.items.map((item, idx) => ({
    productId: item.productId || null,
    name: item.name,
    hsnCode: item.hsnCode || null,
    unit: item.unit,
    quantity: item.quantity,
    rate: item.rate,
    discountPct: item.discountPct,
    gstRate: item.gstRate,
    ...calc.lines[idx],
    unitCost: item.productId ? costOf.get(item.productId) ?? 0 : 0,
  }));
  const costTotal = round2(items.reduce((s, i) => s + i.unitCost * i.quantity, 0));

  // Two people billing at the same moment can race for the same number; the unique
  // index rejects the loser, which simply retries with the next number.
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const invoiceNumber = await nextInvoiceNumber(tx, settings.invoicePrefix, date);
          const customerId = await resolveCustomer(tx, input);
          const c = input.customer;
          const invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              invoiceDate: date,
              customerId,
              orderId: input.orderId || null,
              billName: c.name,
              billBusiness: c.businessName || null,
              billPhone: c.phone || null,
              billEmail: c.email || null,
              billAddress: c.address || null,
              billGstin: c.gstin ? c.gstin.toUpperCase() : null,
              placeOfSupply: c.state,
              interState,
              pricesIncTax: input.pricesIncTax,
              taxableTotal: calc.taxableTotal,
              cgst: calc.cgst,
              sgst: calc.sgst,
              igst: calc.igst,
              roundOff: calc.roundOff,
              total: calc.total,
              costTotal,
              amountPaid: Math.min(input.amountPaid, calc.total),
              paymentMode: input.paymentMode || null,
              notes: input.notes || null,
              items: { create: items },
            },
          });
          for (const item of items) {
            if (!item.productId) continue;
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: "SALE",
                change: -item.quantity,
                unitCost: item.unitCost,
                note: `Invoice ${invoiceNumber}`,
                invoiceId: invoice.id,
              },
            });
          }
          return invoice;
        },
        { timeout: 20000 }
      );
    } catch (err) {
      const isNumberClash =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        String(err.meta?.target).includes("invoiceNumber");
      if (!isNumberClash || attempt >= 4) throw err;
    }
  }
}

// Cancelling keeps the invoice (GST numbering must not have gaps) and puts the stock back.
export async function cancelInvoice(id: string) {
  return prisma.$transaction(
    async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id }, include: { items: true } });
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === "CANCELLED") return invoice;
      for (const item of invoice.items) {
        if (!item.productId) continue;
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "SALE_CANCELLED",
            change: item.quantity,
            unitCost: item.unitCost,
            note: `Invoice ${invoice.invoiceNumber} cancelled`,
            invoiceId: invoice.id,
          },
        });
      }
      return tx.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
    },
    { timeout: 20000 }
  );
}

export function paymentStatus(inv: { total: number; amountPaid: number; status: string }) {
  if (inv.status === "CANCELLED") return "CANCELLED";
  if (inv.amountPaid >= inv.total - 0.005) return "PAID";
  return inv.amountPaid > 0 ? "PARTIAL" : "UNPAID";
}
