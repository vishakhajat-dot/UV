import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { Invoice, InvoiceItem } from "@prisma/client";
import { amountInWords, round2, splitByRate, stateLabel } from "@/lib/gst";
import type { BusinessSettingsData } from "@/lib/settings";

const W = 595.28;
const H = 841.89;
const M = 36;
const INNER = W - M * 2;

const BLUE = rgb(0.102, 0.451, 0.784); // #1a73c8
const NAVY = rgb(0.043, 0.227, 0.4); // #0b3a66
const SKY = rgb(0.918, 0.961, 0.992); // #eaf5fd
const LINE = rgb(0.78, 0.86, 0.94);
const GRAY = rgb(0.38, 0.42, 0.48);
const BLACK = rgb(0.1, 0.12, 0.15);
const WHITE = rgb(1, 1, 1);

// The standard PDF fonts only cover Latin-1. Anything else (Rs symbol, Devanagari)
// would make pdf-lib throw, so swap it for something printable.
function clean(s: string | null | undefined) {
  return (s ?? "").replace(/₹/g, "Rs").replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

const money = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
      // A single word longer than the column gets hard-cut.
      while (font.widthOfTextAtSize(line, size) > width && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > width) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

let logoBytes: Uint8Array | null | undefined;
async function loadLogo() {
  if (logoBytes === undefined) {
    try {
      logoBytes = await readFile(path.join(process.cwd(), "public", "images", "logo.png"));
    } catch {
      logoBytes = null;
    }
  }
  return logoBytes;
}

type Col = { key: string; label: string; width: number; align: "left" | "right" | "center" };

export async function generateTaxInvoicePdf(
  invoice: Invoice & { items: InvoiceItem[] },
  biz: BusinessSettingsData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tax Invoice ${invoice.invoiceNumber}`);
  pdf.setAuthor(biz.businessName);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoData = await loadLogo();
  let logo: PDFImage | null = null;
  if (logoData) {
    try {
      logo = await pdf.embedPng(logoData);
    } catch {
      logo = null;
    }
  }

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const text = (
    s: string,
    x: number,
    yy: number,
    opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb>; align?: "left" | "right" | "center"; width?: number } = {}
  ) => {
    const size = opts.size ?? 9;
    const f = opts.f ?? font;
    const str = clean(s);
    const tw = f.widthOfTextAtSize(str, size);
    let dx = x;
    if (opts.align === "right" && opts.width !== undefined) dx = x + opts.width - tw;
    if (opts.align === "center" && opts.width !== undefined) dx = x + (opts.width - tw) / 2;
    page.drawText(str, { x: dx, y: yy, size, font: f, color: opts.color ?? BLACK });
  };
  const hline = (yy: number, color = LINE, thickness = 0.8) =>
    page.drawLine({ start: { x: M, y: yy }, end: { x: W - M, y: yy }, thickness, color });

  // ---- Title strip
  page.drawRectangle({ x: M, y: y - 20, width: INNER, height: 20, color: BLUE });
  text("TAX INVOICE", M, y - 14, { size: 11, f: bold, color: WHITE, align: "center", width: INNER });
  text("Original for Recipient", M, y - 13.5, { size: 7.5, color: WHITE, align: "right", width: INNER - 8 });
  y -= 30;

  // ---- Business header: logo on the left, details beside it
  const logoH = 70;
  let infoX = M;
  if (logo) {
    const logoW = (logo.width / logo.height) * logoH;
    page.drawImage(logo, { x: M, y: y - logoH, width: logoW, height: logoH });
    infoX = M + logoW + 14;
  }
  let hy = y - 14;
  text(biz.businessName, infoX, hy, { size: 16, f: bold, color: NAVY });
  hy -= 14;
  text(`${biz.ownerName}  |  ${biz.ownerEmail}`, infoX, hy, { size: 9.5, f: bold, color: BLUE });
  hy -= 12;
  for (const line of wrap(biz.address, font, 8.5, W - M - infoX)) {
    text(line, infoX, hy, { size: 8.5, color: GRAY });
    hy -= 11;
  }
  text(`Phone: ${biz.phone}`, infoX, hy, { size: 8.5, color: GRAY });
  hy -= 11;
  const gstLine = [biz.gstin ? `GSTIN: ${biz.gstin}` : null, `State: ${stateLabel(biz.state)}`].filter(Boolean).join("   ");
  text(gstLine, infoX, hy, { size: 8.5, f: biz.gstin ? bold : font, color: biz.gstin ? BLACK : GRAY });
  y = Math.min(y - logoH, hy) - 10;
  hline(y, BLUE, 1.2);
  y -= 8;

  // ---- Bill to (left) and invoice details (right)
  const half = INNER / 2;
  const boxTop = y;
  let ly = y - 12;
  text("BILL TO", M + 8, ly, { size: 7.5, f: bold, color: BLUE });
  ly -= 13;
  text(invoice.billBusiness || invoice.billName, M + 8, ly, { size: 10.5, f: bold });
  ly -= 12;
  if (invoice.billBusiness) {
    text(invoice.billName, M + 8, ly, { size: 8.5, color: GRAY });
    ly -= 11;
  }
  if (invoice.billAddress) {
    for (const line of wrap(invoice.billAddress, font, 8.5, half - 20).slice(0, 3)) {
      text(line, M + 8, ly, { size: 8.5, color: GRAY });
      ly -= 11;
    }
  }
  const contact = [invoice.billPhone && `Ph: ${invoice.billPhone}`, invoice.billEmail].filter(Boolean).join("   ");
  if (contact) {
    text(contact, M + 8, ly, { size: 8.5, color: GRAY });
    ly -= 11;
  }
  if (invoice.billGstin) {
    text(`GSTIN: ${invoice.billGstin}`, M + 8, ly, { size: 8.5, f: bold });
    ly -= 11;
  }

  const rx = M + half + 8;
  const rw = half - 16;
  let ry = y - 12;
  const detail = (label: string, value: string) => {
    text(label, rx, ry, { size: 8.5, color: GRAY });
    text(value, rx, ry, { size: 8.5, f: bold, align: "right", width: rw });
    ry -= 13;
  };
  detail("Invoice No.", invoice.invoiceNumber);
  detail(
    "Invoice Date",
    new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
  );
  detail("Place of Supply", stateLabel(invoice.placeOfSupply));
  detail("Tax Type", invoice.interState ? "IGST (inter-state)" : "CGST + SGST");
  if (invoice.paymentMode) detail("Payment Mode", invoice.paymentMode);

  y = Math.min(ly, ry) - 4;
  page.drawRectangle({ x: M, y, width: INNER, height: boxTop - y, borderColor: LINE, borderWidth: 0.8 });
  page.drawLine({ start: { x: M + half, y }, end: { x: M + half, y: boxTop }, thickness: 0.8, color: LINE });
  if (invoice.status === "CANCELLED") {
    text("CANCELLED", M, y + (boxTop - y) / 2 - 8, { size: 26, f: bold, color: rgb(0.85, 0.2, 0.2), align: "center", width: INNER });
  }
  y -= 12;

  // ---- Items table
  const cols: Col[] = [
    { key: "sn", label: "#", width: 18, align: "center" },
    { key: "name", label: "Item", width: 146, align: "left" },
    { key: "hsn", label: "HSN", width: 44, align: "center" },
    { key: "qty", label: "Qty", width: 36, align: "right" },
    { key: "rate", label: invoice.pricesIncTax ? "Rate*" : "Rate", width: 56, align: "right" },
    { key: "disc", label: "Disc%", width: 32, align: "right" },
    { key: "taxable", label: "Taxable", width: 60, align: "right" },
    { key: "gst", label: "GST%", width: 30, align: "right" },
    { key: "gstAmt", label: "GST Amt", width: 48, align: "right" },
    { key: "amount", label: "Amount", width: INNER - 470, align: "right" },
  ];
  const PAD = 4;

  const drawHeader = () => {
    page.drawRectangle({ x: M, y: y - 18, width: INNER, height: 18, color: NAVY });
    let x = M;
    for (const c of cols) {
      text(c.label, x + PAD, y - 12.5, { size: 7.5, f: bold, color: WHITE, align: c.align, width: c.width - PAD * 2 });
      x += c.width;
    }
    y -= 18;
  };

  const newPage = () => {
    page = pdf.addPage([W, H]);
    y = H - M;
    text(`${biz.businessName}  -  Invoice ${invoice.invoiceNumber} (continued)`, M, y - 10, { size: 8.5, color: GRAY });
    y -= 22;
  };

  drawHeader();
  invoice.items.forEach((item, idx) => {
    const nameLines = wrap(item.name, font, 8, cols[1].width - PAD * 2);
    const rowH = Math.max(18, nameLines.length * 10 + 8);
    if (y - rowH < M + 40) {
      newPage();
      drawHeader();
    }
    if (idx % 2 === 1) page.drawRectangle({ x: M, y: y - rowH, width: INNER, height: rowH, color: SKY });
    const values: Record<string, string> = {
      sn: String(idx + 1),
      hsn: item.hsnCode || "-",
      qty: `${item.quantity} ${item.unit === "piece" ? "" : item.unit}`.trim(),
      rate: money(item.rate),
      disc: item.discountPct ? String(round2(item.discountPct)) : "-",
      taxable: money(item.taxableValue),
      gst: `${item.gstRate}`,
      gstAmt: money(item.gstAmount),
      amount: money(item.lineTotal),
    };
    let x = M;
    for (const c of cols) {
      if (c.key === "name") {
        nameLines.forEach((l, i) => text(l, x + PAD, y - 12 - i * 10, { size: 8 }));
      } else {
        text(values[c.key], x + PAD, y - 12, { size: 8, align: c.align, width: c.width - PAD * 2 });
      }
      x += c.width;
    }
    y -= rowH;
    hline(y);
  });

  const totalQty = invoice.items.reduce((s, i) => s + i.quantity, 0);
  page.drawRectangle({ x: M, y: y - 16, width: INNER, height: 16, color: SKY });
  text("Total", M + cols[0].width + PAD, y - 11, { size: 8, f: bold });
  const qtyX = M + cols.slice(0, 3).reduce((s, c) => s + c.width, 0);
  text(String(totalQty), qtyX + PAD, y - 11, { size: 8, f: bold, align: "right", width: cols[3].width - PAD * 2 });
  const taxX = M + cols.slice(0, 6).reduce((s, c) => s + c.width, 0);
  text(money(invoice.taxableTotal), taxX + PAD, y - 11, { size: 8, f: bold, align: "right", width: cols[6].width - PAD * 2 });
  const gstAmtX = M + cols.slice(0, 8).reduce((s, c) => s + c.width, 0);
  text(money(round2(invoice.cgst + invoice.sgst + invoice.igst)), gstAmtX + PAD, y - 11, {
    size: 8,
    f: bold,
    align: "right",
    width: cols[8].width - PAD * 2,
  });
  y -= 16;
  if (invoice.pricesIncTax) {
    text("* Rates are inclusive of GST; taxable value is worked back from the rate.", M, y - 10, { size: 7, color: GRAY });
    y -= 12;
  }
  y -= 10;

  // ---- Tax summary (left) and totals (right)
  const summaryRows = splitByRate(invoice.items);
  const neededHeight = Math.max(summaryRows.length * 13 + 30, 110) + 150;
  if (y - neededHeight < M) newPage();

  const sumW = 290;
  const sCols = invoice.interState
    ? [
        { label: "GST %", w: 50 },
        { label: "Taxable", w: 90 },
        { label: "IGST", w: 75 },
        { label: "Total Tax", w: 75 },
      ]
    : [
        { label: "GST %", w: 40 },
        { label: "Taxable", w: 70 },
        { label: "CGST", w: 60 },
        { label: "SGST", w: 60 },
        { label: "Total Tax", w: 60 },
      ];
  const sTop = y;
  page.drawRectangle({ x: M, y: y - 15, width: sumW, height: 15, color: SKY });
  let sx = M;
  for (const c of sCols) {
    text(c.label, sx + PAD, y - 10.5, { size: 7.5, f: bold, color: NAVY, align: "right", width: c.w - PAD * 2 });
    sx += c.w;
  }
  y -= 15;
  for (const g of summaryRows) {
    const vals = invoice.interState
      ? [`${g.rate}%`, money(g.taxable), money(g.tax), money(g.tax)]
      : [`${g.rate}%`, money(g.taxable), money(g.cgst), money(g.sgst), money(g.tax)];
    sx = M;
    sCols.forEach((c, i) => {
      text(vals[i], sx + PAD, y - 10.5, { size: 7.5, align: "right", width: c.w - PAD * 2 });
      sx += c.w;
    });
    y -= 13;
  }
  page.drawRectangle({ x: M, y: y - 3, width: sumW, height: sTop - y + 3, borderColor: LINE, borderWidth: 0.8 });
  const summaryBottom = y - 3;

  // Totals block
  const tx = M + INNER - 200;
  const tw = 200;
  let ty = sTop;
  const totalRow = (label: string, value: string, strong = false) => {
    text(label, tx + 6, ty - 11, { size: strong ? 9.5 : 8.5, f: strong ? bold : font, color: strong ? WHITE : GRAY });
    text(value, tx, ty - 11, { size: strong ? 10.5 : 8.5, f: bold, color: strong ? WHITE : BLACK, align: "right", width: tw - 6 });
    ty -= 15;
  };
  totalRow("Taxable Amount", money(invoice.taxableTotal));
  if (invoice.interState) {
    totalRow("IGST", money(invoice.igst));
  } else {
    totalRow("CGST", money(invoice.cgst));
    totalRow("SGST", money(invoice.sgst));
  }
  if (invoice.roundOff) totalRow("Round Off", (invoice.roundOff > 0 ? "+" : "") + money(invoice.roundOff));
  page.drawRectangle({ x: tx, y: ty - 19, width: tw, height: 19, color: BLUE });
  ty -= 3;
  totalRow("Grand Total", `Rs ${money(invoice.total)}`, true);
  ty -= 4;
  totalRow("Received", money(invoice.amountPaid));
  const balance = round2(invoice.total - invoice.amountPaid);
  totalRow("Balance Due", money(balance));

  y = Math.min(summaryBottom, ty) - 12;
  text("Amount in words:", M, y, { size: 8, f: bold, color: NAVY });
  const words = wrap(amountInWords(invoice.total), font, 8.5, INNER - 80);
  words.forEach((w, i) => text(w, M + 78, y - i * 11, { size: 8.5 }));
  y -= words.length * 11 + 8;
  hline(y);
  y -= 14;

  // ---- Bank / notes / terms (left) and signature (right)
  const leftW = INNER - 210;
  let by = y;
  const bankBits = [
    biz.bankName && `Bank: ${biz.bankName}`,
    biz.accountNumber && `A/c No: ${biz.accountNumber}`,
    biz.ifsc && `IFSC: ${biz.ifsc}`,
    biz.upiId && `UPI: ${biz.upiId}`,
  ].filter(Boolean) as string[];
  if (bankBits.length) {
    text("Payment Details", M, by, { size: 8, f: bold, color: NAVY });
    by -= 11;
    for (const b of bankBits) {
      text(b, M, by, { size: 8, color: GRAY });
      by -= 10;
    }
    by -= 4;
  }
  if (invoice.notes) {
    text("Notes", M, by, { size: 8, f: bold, color: NAVY });
    by -= 11;
    for (const l of wrap(invoice.notes, font, 8, leftW).slice(0, 4)) {
      text(l, M, by, { size: 8, color: GRAY });
      by -= 10;
    }
    by -= 4;
  }
  if (biz.terms) {
    text("Terms & Conditions", M, by, { size: 8, f: bold, color: NAVY });
    by -= 11;
    for (const para of biz.terms.split(/\r?\n/)) {
      for (const l of wrap(para, font, 7.5, leftW)) {
        text(l, M, by, { size: 7.5, color: GRAY });
        by -= 9.5;
      }
    }
  }

  const sigX = W - M - 200;
  text(`For ${biz.businessName}`, sigX, y, { size: 9, f: bold, color: NAVY, align: "right", width: 200 });
  page.drawLine({ start: { x: sigX + 60, y: y - 46 }, end: { x: W - M, y: y - 46 }, thickness: 0.6, color: GRAY });
  text(biz.ownerName, sigX, y - 57, { size: 8.5, f: bold, align: "right", width: 200 });
  text("Authorised Signatory", sigX, y - 68, { size: 7.5, color: GRAY, align: "right", width: 200 });

  y = Math.min(by, y - 72) - 14;
  text("This is a computer-generated invoice.", M, Math.max(y, M - 10), { size: 7, color: GRAY, align: "center", width: INNER });

  return pdf.save();
}
