import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { round2 } from "@/lib/gst";
import { stockEntrySchema } from "@/lib/validation";

// Stock in (a purchase) or a manual correction. Purchases move the product's cost to
// the weighted average of what is already on the shelf and what just came in.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const parsed = stockEntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { productId, type, quantity, unitCost, note } = parsed.data;
  if (type === "PURCHASE" && quantity < 0) {
    return NextResponse.json({ error: "A purchase must add stock. Use an adjustment to reduce it." }, { status: 400 });
  }

  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    let costPrice = p.costPrice;
    if (type === "PURCHASE" && unitCost != null) {
      // With no cost on record yet, the purchase price is the only real figure to use.
      const onHand = p.costPrice > 0 ? Math.max(p.stock, 0) : 0;
      costPrice = onHand > 0 ? round2((onHand * p.costPrice + quantity * unitCost) / (onHand + quantity)) : unitCost;
    }
    await tx.stockMovement.create({
      data: {
        productId,
        type,
        change: quantity,
        unitCost: type === "PURCHASE" ? unitCost ?? p.costPrice : null,
        note: note || null,
      },
    });
    return tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity }, costPrice },
    });
  });

  return NextResponse.json({ product: { id: product.id, stock: product.stock, costPrice: product.costPrice } });
}
