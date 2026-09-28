import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { vendorSchema } from "@/lib/validation";
import { vendorData } from "@/lib/customers";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = vendorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const duplicate = await prisma.vendor.findFirst({ where: { name: { equals: parsed.data.name, mode: "insensitive" } } });
  if (duplicate) return NextResponse.json({ error: "A vendor with this name already exists." }, { status: 409 });

  const vendor = await prisma.vendor.create({ data: vendorData(parsed.data) });
  return NextResponse.json({ vendor }, { status: 201 });
}
