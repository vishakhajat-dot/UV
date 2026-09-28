import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { deletePurchase, savePurchase } from "@/lib/purchases";
import { purchaseSchema } from "@/lib/validation";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = purchaseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid purchase" }, { status: 400 });
  }
  const exists = await prisma.purchaseBill.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  const purchase = await savePurchase(parsed.data, params.id);
  return NextResponse.json({ purchase });
}

const paymentSchema = z.object({
  amountPaid: z.number().nonnegative(),
  paymentMode: z.string().trim().optional().nullable(),
});

// Quick "record payment" without re-saving the whole bill.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = paymentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
  const bill = await prisma.purchaseBill.findUnique({ where: { id: params.id } });
  if (!bill) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  const purchase = await prisma.purchaseBill.update({
    where: { id: params.id },
    data: {
      amountPaid: Math.min(parsed.data.amountPaid, bill.total),
      paymentMode: parsed.data.paymentMode || bill.paymentMode,
    },
  });
  return NextResponse.json({ purchase });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  await deletePurchase(params.id);
  return NextResponse.json({ ok: true });
}
