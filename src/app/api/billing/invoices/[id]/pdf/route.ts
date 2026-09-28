import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { getSettings } from "@/lib/settings";
import { generateTaxInvoicePdf } from "@/lib/taxInvoicePdf";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const pdf = await generateTaxInvoicePdf(invoice, await getSettings());
  const filename = invoice.invoiceNumber.replace(/[^A-Za-z0-9-]+/g, "_");
  const download = req.nextUrl.searchParams.get("download") === "1";
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
