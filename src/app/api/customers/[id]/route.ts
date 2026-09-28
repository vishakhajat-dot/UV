import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { customerSchema } from "@/lib/validation";
import { customerData } from "@/lib/customers";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = customerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const duplicate = await prisma.customer.findFirst({
    where: { phone: parsed.data.phone, id: { not: params.id } },
  });
  if (duplicate) {
    return NextResponse.json({ error: `${duplicate.name} already uses this phone number.` }, { status: 409 });
  }
  const customer = await prisma.customer.update({ where: { id: params.id }, data: customerData(parsed.data) });
  return NextResponse.json({ customer });
}

// Bills already issued keep their printed customer details; they just lose the link.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  await prisma.customer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
