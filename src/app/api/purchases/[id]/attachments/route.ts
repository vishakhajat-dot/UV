import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// Vercel caps request bodies at 4.5 MB; photos are shrunk in the browser first.
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Body is the raw file; its name comes in the X-File-Name header (URI-encoded).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const mimeType = req.headers.get("content-type")?.split(";")[0] ?? "";
  if (!ALLOWED.includes(mimeType)) {
    return NextResponse.json({ error: "Upload a photo (JPG, PNG, WebP) or a PDF." }, { status: 400 });
  }
  const data = Buffer.from(await req.arrayBuffer());
  if (data.length === 0 || data.length > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 4 MB." }, { status: 400 });
  }
  const bill = await prisma.purchaseBill.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!bill) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  let fileName = "attachment";
  try {
    fileName = decodeURIComponent(req.headers.get("x-file-name") || "attachment").slice(0, 120);
  } catch {}

  const attachment = await prisma.purchaseAttachment.create({
    data: { purchaseBillId: params.id, fileName, mimeType, size: data.length, data },
    select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true },
  });
  return NextResponse.json({ attachment }, { status: 201 });
}
