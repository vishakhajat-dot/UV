import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const allowedStatus = ["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"];
  const allowedPayment = ["UNPAID", "PAID"];

  const data: Record<string, string> = {};
  if (body.status && allowedStatus.includes(body.status)) data.status = body.status;
  if (body.paymentStatus && allowedPayment.includes(body.paymentStatus)) data.paymentStatus = body.paymentStatus;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const order = await prisma.order.update({ where: { id: params.id }, data, include: { items: true } });
  return NextResponse.json({ order });
}
