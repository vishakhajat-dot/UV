import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { SITE } from "./whatsapp";

type InvoiceItem = {
  productName: string;
  price: number;
  quantity: number;
};

type InvoiceOrder = {
  orderNumber: string;
  customerName: string;
  businessName?: string | null;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress: string;
  notes?: string | null;
  paymentMethod?: string | null;
  subtotal: number;
  createdAt: Date | string;
  items: InvoiceItem[];
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const NAVY = rgb(0.043, 0.227, 0.4);
const ACCENT = rgb(0.102, 0.451, 0.784);
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT = rgb(0.96, 0.97, 0.98);

export async function generateInvoicePdf(order: InvoiceOrder): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPageIfNeeded = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  // Header
  page.drawText(SITE.name, { x: MARGIN, y, size: 20, font: bold, color: NAVY });
  y -= 18;
  page.drawText(SITE.address, { x: MARGIN, y, size: 9, font, color: GRAY });
  y -= 12;
  page.drawText(
    `Phone: ${SITE.phonePrimary} / ${SITE.phoneSecondary}  |  Email: ${SITE.email}`,
    { x: MARGIN, y, size: 9, font, color: GRAY }
  );
  y -= 20;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1.5,
    color: ACCENT,
  });
  y -= 26;

  // Title + order meta
  page.drawText("QUOTATION / ORDER BILL", { x: MARGIN, y, size: 14, font: bold, color: NAVY });
  const createdStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const metaText = `Order #: ${order.orderNumber}   Date: ${createdStr}`;
  const metaWidth = font.widthOfTextAtSize(metaText, 10);
  page.drawText(metaText, { x: PAGE_WIDTH - MARGIN - metaWidth, y: y + 2, size: 10, font, color: GRAY });
  y -= 24;

  // Bill To box
  page.drawRectangle({ x: MARGIN, y: y - 62, width: PAGE_WIDTH - MARGIN * 2, height: 62, color: LIGHT });
  let by = y - 14;
  page.drawText("Bill To:", { x: MARGIN + 10, y: by, size: 9, font: bold, color: NAVY });
  by -= 13;
  const billName = order.businessName ? `${order.businessName} (${order.customerName})` : order.customerName;
  page.drawText(billName, { x: MARGIN + 10, y: by, size: 10, font: bold, color: rgb(0, 0, 0) });
  by -= 13;
  page.drawText(order.customerAddress, { x: MARGIN + 10, y: by, size: 9, font, color: GRAY });
  by -= 13;
  const contactLine = `Phone: ${order.customerPhone}` + (order.customerEmail ? `   Email: ${order.customerEmail}` : "");
  page.drawText(contactLine, { x: MARGIN + 10, y: by, size: 9, font, color: GRAY });
  y -= 80;

  // Table header
  const col = { item: MARGIN, qty: PAGE_WIDTH - MARGIN - 190, price: PAGE_WIDTH - MARGIN - 130, total: PAGE_WIDTH - MARGIN - 60 };
  const drawTableHeader = () => {
    page.drawRectangle({ x: MARGIN, y: y - 20, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: NAVY });
    page.drawText("Item", { x: col.item + 6, y: y - 14, size: 9, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Qty", { x: col.qty, y: y - 14, size: 9, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Price", { x: col.price, y: y - 14, size: 9, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Total", { x: col.total, y: y - 14, size: 9, font: bold, color: rgb(1, 1, 1) });
    y -= 24;
  };
  drawTableHeader();

  order.items.forEach((item, idx) => {
    newPageIfNeeded(24);
    if (idx % 2 === 1) {
      page.drawRectangle({ x: MARGIN, y: y - 16, width: PAGE_WIDTH - MARGIN * 2, height: 18, color: LIGHT });
    }
    const lineTotal = item.price * item.quantity;
    const nameTrunc = item.productName.length > 46 ? item.productName.slice(0, 43) + "..." : item.productName;
    page.drawText(nameTrunc, { x: col.item + 6, y: y - 12, size: 9, font, color: rgb(0, 0, 0) });
    page.drawText(String(item.quantity), { x: col.qty, y: y - 12, size: 9, font, color: rgb(0, 0, 0) });
    page.drawText(`Rs ${item.price.toFixed(2)}`, { x: col.price, y: y - 12, size: 9, font, color: rgb(0, 0, 0) });
    page.drawText(`Rs ${lineTotal.toFixed(2)}`, { x: col.total, y: y - 12, size: 9, font, color: rgb(0, 0, 0) });
    y -= 20;
  });

  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: GRAY });
  y -= 22;

  newPageIfNeeded(40);
  page.drawText("Subtotal:", { x: col.price - 20, y, size: 11, font: bold, color: NAVY });
  page.drawText(`Rs ${order.subtotal.toFixed(2)}`, { x: col.total, y, size: 11, font: bold, color: NAVY });
  y -= 30;

  // Payment / notes
  newPageIfNeeded(90);
  page.drawText("Payment:", { x: MARGIN, y, size: 9, font: bold, color: NAVY });
  page.drawText(
    order.paymentMethod || "To be confirmed with the shop (Cash / Bank Transfer / UPI on delivery or pickup)",
    { x: MARGIN + 55, y, size: 9, font, color: GRAY }
  );
  y -= 16;

  if (order.notes) {
    page.drawText("Notes:", { x: MARGIN, y, size: 9, font: bold, color: NAVY });
    page.drawText(order.notes.slice(0, 100), { x: MARGIN + 55, y, size: 9, font, color: GRAY });
    y -= 16;
  }

  y -= 10;
  page.drawText(
    "This is a quotation / provisional bill generated from the website order request. Final GST invoice",
    { x: MARGIN, y, size: 8, font, color: GRAY }
  );
  y -= 11;
  page.drawText(
    "will be shared by Mahalaxmi Auto Agency upon order confirmation and dispatch.",
    { x: MARGIN, y, size: 8, font, color: GRAY }
  );
  y -= 20;
  page.drawText(`Thank you for choosing ${SITE.name}!`, { x: MARGIN, y, size: 10, font: bold, color: ACCENT });

  return pdf.save();
}
