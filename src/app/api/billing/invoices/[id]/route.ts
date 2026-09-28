import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { cancelInvoice } from "@/lib/billing";

const patchSchema = z.union([
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("payment"),
    amountPaid: z.number().nonnegative(),
    paymentMode: z.string().trim().optional().nullable(),
  }),
]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (parsed.data.action === "cancel") {
    const invoice = await cancelInvoice(params.id);
    return NextResponse.json({ invoice });
  }

  const existing = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (existing.status === "CANCELLED") {
    return NextResponse.json({ error: "This bill is cancelled." }, { status: 400 });
  }
  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      amountPaid: Math.min(parsed.data.amountPaid, existing.total),
      paymentMode: parsed.data.paymentMode || existing.paymentMode,
    },
  });
  return NextResponse.json({ invoice });
}
