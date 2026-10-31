import { z } from "zod";
import { AGE_GROUPS, GST_RATES } from "./constants";
import { parseRupeesToPaise } from "./money";

export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const CATEGORY_COLORS = [
  "sunshine",
  "sky",
  "bubblegum",
  "mint",
  "orange",
  "grape",
] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const MAX_PRODUCT_IMAGES = 8;

const ageGroupIds = AGE_GROUPS.map((group) => group.id) as [
  (typeof AGE_GROUPS)[number]["id"],
  ...(typeof AGE_GROUPS)[number]["id"][],
];

const optionalText = (max: number) => z.string().trim().max(max).default("");

const rupees = (label: string) =>
  z.string().trim().transform((value, ctx) => {
    if (value === "") return null;
    const paise = parseRupeesToPaise(value);
    if (paise === null) {
      ctx.addIssue({ code: "custom", message: `${label} should be a number like 499 or 499.50` });
      return z.NEVER;
    }
    return paise;
  });

const wholeNumber = (label: string) =>
  z.string().trim().transform((value, ctx) => {
    if (value === "") return null;
    if (!/^\d+$/.test(value)) {
      ctx.addIssue({ code: "custom", message: `${label} should be a whole number` });
      return z.NEVER;
    }
    return Number(value);
  });

// What the add/edit product form sends. Text inputs arrive as strings.
export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Please give the toy a name 🙂")
      .max(120, "Keep the name under 120 letters"),
    shortDescription: optionalText(200),
    description: optionalText(5000),
    categoryId: z.string().trim().transform((value) => value || null),
    ageGroup: z.enum(ageGroupIds, { message: "Pick an age group" }),
    brand: optionalText(60),
    price: rupees("Price").refine((paise) => paise !== null, "Oops! Please add a price 🙂"),
    mrp: rupees("MRP"),
    stock: wholeNumber("Stock"),
    sku: z.string().trim().max(60).transform((value) => value || null),
    gstRate: z.coerce
      .number()
      .refine((rate) => (GST_RATES as readonly number[]).includes(rate), "Pick a GST rate"),
    weightGrams: wholeNumber("Weight").refine(
      (grams) => grams === null || grams > 0,
      "Weight should be more than 0",
    ),
    bisLicense: optionalText(60),
    isFeatured: z.boolean().default(false),
    images: z
      .array(
        z.object({
          storagePath: z.string().min(1).max(300),
          altText: optionalText(200),
        }),
      )
      .max(MAX_PRODUCT_IMAGES, `Up to ${MAX_PRODUCT_IMAGES} photos per toy`)
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.price !== null && data.mrp !== null && data.mrp < data.price) {
      ctx.addIssue({
        code: "custom",
        path: ["mrp"],
        message: "MRP can't be lower than the selling price",
      });
    }
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please give the category a name")
    .max(60, "Keep the name under 60 letters"),
  icon: z.string().trim().min(1, "Pick an emoji").max(16),
  color: z.enum(CATEGORY_COLORS, { message: "Pick a colour" }),
});

export type CategoryFormInput = z.input<typeof categoryFormSchema>;

// Turns validation issues into { fieldName: "message" } for showing under inputs.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "form";
    errors[key] ??= issue.message;
  }
  return errors;
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "toy";
}
