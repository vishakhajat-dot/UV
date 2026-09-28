import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { vendorSchema } from "@/lib/validation";
import { vendorData } from "@/lib/customers";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = vendorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const vendor = await prisma.vendor.update({ where: { id: params.id }, data: vendorData(parsed.data) });
  return NextResponse.json({ vendor });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const bills = await prisma.purchaseBill.count({ where: { vendorId: params.id } });
  if (bills > 0) {
    return NextResponse.json({ error: `This vendor has ${bills} purchase bill(s). Delete those first.` }, { status: 409 });
  }
  await prisma.vendor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
