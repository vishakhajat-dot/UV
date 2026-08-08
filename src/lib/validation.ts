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
