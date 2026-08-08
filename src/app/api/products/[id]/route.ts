import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validation";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
