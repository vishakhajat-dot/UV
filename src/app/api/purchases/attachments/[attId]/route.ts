import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest, { params }: { params: { attId: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const file = await prisma.purchaseAttachment.findUnique({ where: { id: params.attId } });
  if (!file) return new NextResponse("Not found", { status: 404 });
  const disposition = req.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
  return new NextResponse(Buffer.from(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { attId: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  await prisma.purchaseAttachment.deleteMany({ where: { id: params.attId } });
  return NextResponse.json({ ok: true });
}
