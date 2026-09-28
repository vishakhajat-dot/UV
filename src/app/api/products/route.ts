import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productAdminSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/adminAuth";

// Public catalogue feed. Select fields explicitly so cost price, HSN and other
// admin-only columns never leak to customers.
export async function GET() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      brand: true,
      description: true,
      price: true,
      unit: true,
      stock: true,
      imageUrl: true,
      featured: true,
      categoryId: true,
      category: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = productAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
  }

  const data = { ...parsed.data, hsnCode: parsed.data.hsnCode || null };
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({ data });
    if (created.stock !== 0) {
      await tx.stockMovement.create({
        data: { productId: created.id, type: "ADJUSTMENT", change: created.stock, unitCost: created.costPrice, note: "Opening stock" },
      });
    }
    return created;
  });
  return NextResponse.json({ product }, { status: 201 });
}
