import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyBillToken } from "@/lib/billLink";
import { getSettings } from "@/lib/settings";
import { generateTaxInvoicePdf } from "@/lib/taxInvoicePdf";

// Public, link-protected PDF of a bill for the customer (see lib/billLink.ts).
// ?download=1 sends it as a file, which phones save to Downloads / Files.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyBillToken(params.id, req.nextUrl.searchParams.get("k"))) {
    return new NextResponse("This bill link is not valid.", { status: 404 });
  }
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!invoice) return new NextResponse("Bill not found.", { status: 404 });

  const pdf = await generateTaxInvoicePdf(invoice, await getSettings());
  const filename = `Bill-${invoice.invoiceNumber.replace(/[^A-Za-z0-9-]+/g, "_")}.pdf`;
  const download = req.nextUrl.searchParams.get("download") === "1";
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
