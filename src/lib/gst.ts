// GST maths shared by the billing form (live preview) and the server (the numbers that
// get saved). Keep this file free of server-only imports so both sides can use it.

export const GST_RATES = [0, 5, 12, 18, 28];

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
];

export function stateLabel(name: string) {
  const s = INDIAN_STATES.find((x) => x.name === name);
  return s ? `${s.code}-${s.name}` : name;
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function formatINR(n: number) {
  return "Rs " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type LineInput = {
  quantity: number;
  rate: number;
  discountPct: number;
  gstRate: number;
};

export type LineResult = { taxableValue: number; gstAmount: number; lineTotal: number };

// `rate` is per unit. When pricesIncTax is true the rate already contains GST (the way
// shop prices are usually quoted), so the taxable value is backed out of it.
export function computeLine(line: LineInput, pricesIncTax: boolean): LineResult {
  const gross = line.quantity * line.rate * (1 - (line.discountPct || 0) / 100);
  const taxableValue = round2(pricesIncTax ? gross / (1 + line.gstRate / 100) : gross);
  const gstAmount = round2((taxableValue * line.gstRate) / 100);
  return { taxableValue, gstAmount, lineTotal: round2(taxableValue + gstAmount) };
}

// Tax grouped by GST rate, with CGST/SGST halves rounded per rate. The bill's CGST and
// SGST totals are summed from these groups so the rate-wise table on the PDF always
// adds up to the totals printed beside it.
export function splitByRate(lines: { gstRate: number; taxableValue: number; gstAmount: number }[]) {
  const groups = new Map<number, { taxable: number; tax: number }>();
  for (const l of lines) {
    const g = groups.get(l.gstRate) ?? { taxable: 0, tax: 0 };
    g.taxable += l.taxableValue;
    g.tax += l.gstAmount;
    groups.set(l.gstRate, g);
  }
  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, g]) => {
      const tax = round2(g.tax);
      const cgst = round2(tax / 2);
      return { rate, taxable: round2(g.taxable), tax, cgst, sgst: round2(tax - cgst) };
    });
}

export function computeInvoice(lines: LineInput[], pricesIncTax: boolean, interState: boolean) {
  const results = lines.map((l) => computeLine(l, pricesIncTax));
  const taxableTotal = round2(results.reduce((s, r) => s + r.taxableValue, 0));
  const gstTotal = round2(results.reduce((s, r) => s + r.gstAmount, 0));
  const cgst = interState ? 0 : round2(splitByRate(lines.map((l, i) => ({ gstRate: l.gstRate, ...results[i] }))).reduce((s, g) => s + g.cgst, 0));
  const sgst = interState ? 0 : round2(gstTotal - cgst);
  const igst = interState ? gstTotal : 0;
  const exact = round2(taxableTotal + gstTotal);
  const total = Math.round(exact);
  return { lines: results, taxableTotal, gstTotal, cgst, sgst, igst, roundOff: round2(total - exact), total };
}

// Indian financial year runs April to March, e.g. "2026-27".
export function financialYear(date: Date) {
  const y = date.getFullYear();
  const start = date.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}

function threeDigits(n: number) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? twoDigits(rest) : ""].filter(Boolean).join(" ");
}

// 123456 -> "One Lakh Twenty Three Thousand Four Hundred Fifty Six"
export function numberToIndianWords(num: number): string {
  let n = Math.floor(Math.abs(num));
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${numberToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return parts.join(" ");
}

export function amountInWords(amount: number) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  return `Rupees ${numberToIndianWords(rupees)}${paise ? ` and ${twoDigits(paise)} Paise` : ""} Only`;
}
