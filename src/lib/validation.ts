import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  businessName: z.string().optional(),
  customerPhone: z.string().min(10, "Enter a valid phone number"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerAddress: z.string().min(5, "Address is required"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "UPI", "PICKUP"]),
  items: z.array(orderItemSchema).min(1, "Cart cannot be empty"),
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  brand: z.string().min(1),
  description: z.string().min(1),
  price: z.number().nonnegative(),
  unit: z.string().min(1),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  categoryId: z.string().min(1),
});

const GST_RATE = z.number().refine((r) => [0, 5, 12, 18, 28].includes(r), "Invalid GST rate");
const optionalText = z.string().trim().optional().nullable();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

// Admin product form. Stock is only taken on create (as opening stock); after that it
// changes through bills and the Stock page so every movement is recorded.
export const productAdminSchema = productSchema.extend({
  costPrice: z.number().nonnegative(),
  hsnCode: optionalText,
  gstRate: GST_RATE,
  lowStockAt: z.number().int().nonnegative(),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  businessName: optionalText,
  phone: z.string().trim().min(10, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").optional().nullable().or(z.literal("")),
  address: optionalText,
  state: z.string().min(2),
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Za-z0-9]{13}$/, "GSTIN must be 15 characters, starting with the 2-digit state code")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: optionalText,
});

export const invoiceItemSchema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().trim().min(1, "Item name is required"),
  hsnCode: optionalText,
  unit: z.string().min(1),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  rate: z.number().nonnegative(),
  discountPct: z.number().min(0).max(100),
  gstRate: GST_RATE,
});

export const createInvoiceSchema = z.object({
  invoiceDate: isoDate,
  customerId: z.string().optional().nullable(),
  saveCustomer: z.boolean(),
  customer: z.object({
    name: z.string().trim().min(1, "Customer name is required"),
    businessName: optionalText,
    phone: optionalText,
    email: optionalText,
    address: optionalText,
    state: z.string().min(2),
    gstin: optionalText,
  }),
  orderId: z.string().optional().nullable(),
  pricesIncTax: z.boolean(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
  amountPaid: z.number().nonnegative(),
  paymentMode: optionalText,
  notes: optionalText,
});

export const stockEntrySchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["PURCHASE", "ADJUSTMENT"]),
  quantity: z.number().int().refine((q) => q !== 0, "Quantity cannot be zero"),
  unitCost: z.number().nonnegative().optional().nullable(),
  note: optionalText,
});

export const expenseSchema = z.object({
  date: isoDate,
  category: z.string().trim().min(1),
  amount: z.number().positive("Amount must be more than zero"),
  note: optionalText,
});

export const settingsSchema = z.object({
  businessName: z.string().trim().min(2),
  ownerName: z.string().trim().min(2),
  ownerEmail: z.string().trim().email(),
  phone: z.string().trim().min(5),
  address: z.string().trim().min(5),
  state: z.string().min(2),
  gstin: optionalText,
  bankName: optionalText,
  accountNumber: optionalText,
  ifsc: optionalText,
  upiId: optionalText,
  invoicePrefix: z.string().trim().min(1).max(10).regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only"),
  terms: optionalText,
});

export const vendorSchema = z.object({
  name: z.string().trim().min(2, "Vendor name is required"),
  phone: optionalText,
  email: z.string().trim().email("Enter a valid email").optional().nullable().or(z.literal("")),
  gstin: optionalText,
  address: optionalText,
  state: z.string().min(2),
  notes: optionalText,
});

export const purchaseSchema = z.object({
  vendorId: z.string().optional().nullable(),
  vendor: vendorSchema.pick({ name: true, phone: true, gstin: true, address: true, state: true }),
  billNumber: optionalText,
  billDate: isoDate,
  dueDate: isoDate.optional().nullable().or(z.literal("")),
  pricesIncTax: z.boolean(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
  amountPaid: z.number().nonnegative(),
  paymentMode: optionalText,
  notes: optionalText,
});
