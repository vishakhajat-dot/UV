import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

const MAX_BYTES = 1.5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Public: the storefront shows these. The URL carries ?v=<timestamp>, so each new
// upload gets a new URL and the old one can be cached forever.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const image = await prisma.productImage.findUnique({ where: { productId: params.id } });
  if (!image) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

// Body is the raw image (the admin form resizes it in the browser first).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const mimeType = req.headers.get("content-type")?.split(";")[0] ?? "";
  if (!ALLOWED.includes(mimeType)) {
    return NextResponse.json({ error: "Upload a JPG, PNG or WebP image." }, { status: 400 });
  }
  const data = Buffer.from(await req.arrayBuffer());
  if (data.length === 0 || data.length > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 1.5 MB." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.productImage.upsert({
    where: { productId: params.id },
    create: { productId: params.id, data, mimeType },
    update: { data, mimeType },
  });
  const imageUrl = `/api/products/${params.id}/image?v=${Date.now()}`;
  await prisma.product.update({ where: { id: params.id }, data: { imageUrl } });
  return NextResponse.json({ imageUrl });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  await prisma.productImage.deleteMany({ where: { productId: params.id } });
  await prisma.product.update({ where: { id: params.id }, data: { imageUrl: null } });
  return NextResponse.json({ ok: true });
}
