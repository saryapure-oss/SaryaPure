import { z } from "zod";
import { cleanText } from "@/lib/security/sanitize";

export const text = (max: number, min = 1) =>
  z
    .string()
    .transform((s) => cleanText(s))
    .pipe(z.string().min(min, min === 1 ? "This field is required" : `Must be at least ${min} characters`).max(max, `Must be at most ${max} characters`));

export const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .nullable()
    .transform((s) => (s ? cleanText(s) : ""))
    .pipe(z.string().max(max, `Must be at most ${max} characters`))
    .transform((s) => (s.length ? s : null));

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email("Enter a valid email address"));

/** Indian mobile: optional +91/0 prefix, 10 digits starting 6-9 */
export const indianPhone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, "").replace(/^(\+91|0091|91(?=\d{10}$)|0)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export const optionalPhone = z
  .string()
  .optional()
  .nullable()
  .transform((s) => (s ?? "").trim())
  .pipe(z.union([z.literal(""), indianPhone]))
  .transform((s) => (s ? s : null));

export const pincode = z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code");

export const id = z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "Invalid id");

export const quantity = z.coerce.number().int("Quantity must be a whole number").min(1, "Minimum quantity is 1").max(50, "Maximum 50 per item");

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

export const couponCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,30}$/, "Invalid coupon code");

export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain lowercase letters, numbers and hyphens")
  .max(80);

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export const indianState = z.enum(INDIAN_STATES, { message: "Select a valid state" });

export const addressSchema = z.object({
  fullName: text(100, 2),
  phone: indianPhone,
  line1: text(200, 3),
  line2: optionalText(200),
  landmark: optionalText(120),
  city: text(80, 2),
  state: indianState,
  pincode,
  country: z.literal("India").default("India"),
});
export type AddressInput = z.infer<typeof addressSchema>;

/** Convert FormData into a plain object (last value wins, except keys ending in []). */
export function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (key.endsWith("[]")) {
      const k = key.slice(0, -2);
      (out[k] ??= [] as unknown[]);
      (out[k] as unknown[]).push(value);
    } else out[key] = value;
  }
  return out;
}

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  data?: Record<string, unknown>;
};

export const initialActionState: ActionState = { ok: false };
