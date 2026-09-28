import { prisma } from "@/lib/db";
import { SITE } from "@/lib/whatsapp";

export const DEFAULT_SETTINGS = {
  businessName: SITE.name,
  ownerName: process.env.INVOICE_OWNER_NAME || "Utkarsh Chavan",
  ownerEmail: SITE.email,
  phone: `${SITE.phonePrimary} / ${SITE.phoneSecondary}`,
  address: SITE.address,
  state: "Maharashtra",
  gstin: null as string | null,
  bankName: null as string | null,
  accountNumber: null as string | null,
  ifsc: null as string | null,
  upiId: null as string | null,
  invoicePrefix: "MAA",
  terms: "Goods once sold will not be taken back.\nSubject to Pune jurisdiction." as string | null,
};

export type BusinessSettingsData = typeof DEFAULT_SETTINGS;

export async function getSettings(): Promise<BusinessSettingsData> {
  const row = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  if (!row) return DEFAULT_SETTINGS;
  const { id: _id, updatedAt: _u, ...rest } = row;
  return rest;
}
