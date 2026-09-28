import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { productAdminSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = productAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Stock is deliberately not editable here: it moves through bills and the Stock page
  // so there is always a record of why it changed.
  const { stock: _stock, ...data } = parsed.data;
  const product = await prisma.product.update({
    where: { id: params.id },
    data: { ...data, hsnCode: data.hsnCode || null },
  });
  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await prisma.product.delete({ where: { id: params.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        { error: "This product appears in website orders, so it can't be deleted. Set its stock to 0 instead." },
        { status: 409 }
      );
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}
