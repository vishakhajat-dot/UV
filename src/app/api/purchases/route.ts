import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { savePurchase } from "@/lib/purchases";
import { purchaseSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = purchaseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid purchase" }, { status: 400 });
  }
  try {
    const purchase = await savePurchase(parsed.data);
    return NextResponse.json({ purchase }, { status: 201 });
  } catch (err) {
    console.error("savePurchase failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save purchase" }, { status: 500 });
  }
}
