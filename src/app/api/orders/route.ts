import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createOrderSchema } from "@/lib/validation";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/auth";

function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MLA-${y}${m}${d}-${rand}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "One or more products were not found." }, { status: 400 });
  }

  const items = data.items.map((i) => {
    const product = products.find((p) => p.id === i.productId)!;
    return {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: i.quantity,
    };
  });
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerName: data.customerName,
      businessName: data.businessName || null,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      customerAddress: data.customerAddress,
      notes: data.notes || null,
      paymentMethod: data.paymentMethod,
      subtotal,
      items: { create: items },
    },
    include: { items: true },
  });

  return NextResponse.json({ order }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}
