import { z } from "zod";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export const ADDRESS_LABELS = ["Home", "Work", "Other"] as const;

// "98765 43210", "+91-9876543210", "09876543210" → "+919876543210". Null if not
// a valid Indian mobile number.
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

// "+919876543210" → "+91 98765 43210"
export function formatIndianMobile(e164: string): string {
  const digits = e164.replace(/^\+91/, "");
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : e164;
}

const mobile = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeIndianMobile(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a 10-digit Indian mobile number" });
      return z.NEVER;
    }
    return normalized;
  });

export const addressFormSchema = z.object({
  label: z.enum(ADDRESS_LABELS).default("Home"),
  fullName: z.string().trim().min(2, "Please enter the receiver's name").max(80),
  phone: mobile,
  line1: z.string().trim().min(3, "Please enter the house / flat and street").max(120),
  line2: z.string().trim().max(120).default(""),
  landmark: z.string().trim().max(80).default(""),
  city: z.string().trim().min(2, "Please enter the town or city").max(60),
  state: z.enum(INDIAN_STATES, { message: "Please pick a state" }),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Pincode should be 6 digits"),
  isDefault: z.boolean().default(false),
});

export type AddressFormInput = z.input<typeof addressFormSchema>;

export const profileFormSchema = z.object({
  fullName: z.string().trim().max(80).default(""),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const normalized = normalizeIndianMobile(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "Enter a 10-digit Indian mobile number" });
        return z.NEVER;
      }
      return normalized;
    }),
});

export type ProfileFormInput = z.input<typeof profileFormSchema>;

// Only allow redirects to pages on this site (never "//evil.com").
export function safeNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
