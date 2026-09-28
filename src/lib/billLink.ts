import { createHmac, timingSafeEqual } from "crypto";

// Customers open their bill from a WhatsApp/email link without logging in. The link
// carries an HMAC of the bill id, so only someone who was sent the link can open it,
// and bill ids can't be guessed into other customers' bills.
function sign(id: string) {
  const secret = process.env.AUTH_SECRET || "insecure-dev-secret";
  return createHmac("sha256", secret).update(`bill:${id}`).digest("base64url").slice(0, 24);
}

export function verifyBillToken(id: string, token: string | null | undefined) {
  if (!token) return false;
  const expected = Buffer.from(sign(id));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// The customer's bill page (summary + download buttons).
export function billPath(id: string) {
  return `/bill/${id}?k=${sign(id)}`;
}

export function billPdfPath(id: string, download: boolean) {
  return `/bill/${id}/pdf?k=${sign(id)}${download ? "&download=1" : ""}`;
}
