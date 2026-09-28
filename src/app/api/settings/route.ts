import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { settingsSchema } from "@/lib/validation";

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: `${first?.path.join(".")}: ${first?.message}` }, { status: 400 });
  }
  const d = parsed.data;
  const data = {
    ...d,
    gstin: d.gstin ? d.gstin.toUpperCase() : null,
    bankName: d.bankName || null,
    accountNumber: d.accountNumber || null,
    ifsc: d.ifsc ? d.ifsc.toUpperCase() : null,
    upiId: d.upiId || null,
    invoicePrefix: d.invoicePrefix.toUpperCase(),
    terms: d.terms || null,
  };
  const settings = await prisma.businessSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });
  return NextResponse.json({ settings });
}
