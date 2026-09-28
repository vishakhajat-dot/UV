import type { z } from "zod";
import type { customerSchema, vendorSchema } from "@/lib/validation";

export function customerData(data: z.infer<typeof customerSchema>) {
  return {
    name: data.name,
    businessName: data.businessName || null,
    phone: data.phone,
    email: data.email || null,
    address: data.address || null,
    state: data.state,
    gstin: data.gstin ? data.gstin.toUpperCase() : null,
    notes: data.notes || null,
  };
}

export function vendorData(data: z.infer<typeof vendorSchema>) {
  return {
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    gstin: data.gstin ? data.gstin.toUpperCase() : null,
    address: data.address || null,
    state: data.state,
    notes: data.notes || null,
  };
}
