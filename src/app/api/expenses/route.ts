import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { parseISTDate } from "@/lib/billing";
import { expenseSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = expenseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const expense = await prisma.expense.create({
    data: {
      date: parseISTDate(parsed.data.date),
      category: parsed.data.category,
      amount: parsed.data.amount,
      note: parsed.data.note || null,
    },
  });
  return NextResponse.json({ expense }, { status: 201 });
}
