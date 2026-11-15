// Rules for the address and profile forms. Kept apart from account.ts so that
// pages in the browser don't have to download the validation library (zod):
// the server checks these forms.
import { z } from "zod";
import { ADDRESS_LABELS, INDIAN_STATES, normalizeIndianMobile } from "./account";

const mobile = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeIndianMobile(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "v.mobile" });
      return z.NEVER;
    }
    return normalized;
  });

// Error messages are translation keys (see i18n/en.ts "v.*").
export const addressFormSchema = z.object({
  label: z.enum(ADDRESS_LABELS).default("Home"),
  fullName: z.string().trim().min(2, "v.receiver").max(80),
  phone: mobile,
  line1: z.string().trim().min(3, "v.line1").max(120),
  line2: z.string().trim().max(120).default(""),
  landmark: z.string().trim().max(80).default(""),
  city: z.string().trim().min(2, "v.city").max(60),
  state: z.enum(INDIAN_STATES, { message: "v.state" }),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "v.pincode"),
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
        ctx.addIssue({ code: "custom", message: "v.mobile" });
        return z.NEVER;
      }
      return normalized;
    }),
});

export type ProfileFormInput = z.input<typeof profileFormSchema>;
