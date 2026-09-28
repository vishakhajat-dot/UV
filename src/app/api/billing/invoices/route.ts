import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { createInvoice } from "@/lib/billing";
import { createInvoiceSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = createInvoiceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid bill" }, { status: 400 });
  }

  try {
    const invoice = await createInvoice(parsed.data);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err) {
    console.error("createInvoice failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save the bill" }, { status: 500 });
  }
}
