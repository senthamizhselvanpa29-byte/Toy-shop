"use server";

import { revalidatePath } from "next/cache";
import { categoryFormSchema, fieldErrors, slugify, type CategoryFormInput } from "@toyshop/shared";
import { requireOwner } from "@/lib/auth";

export type CategoryResult = { errors?: Record<string, string> };

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function saveCategory(
  categoryId: string | null,
  input: CategoryFormInput,
): Promise<CategoryResult> {
  const { supabase } = await requireOwner();
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (categoryId) {
    const { error } = await supabase.from("categories").update(parsed.data).eq("id", categoryId);
    if (error) return { errors: { form: "Couldn't save the category. Please try again." } };
  } else {
    const { data: last } = await supabase
      .from("categories")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const base = slugify(parsed.data.name);
    const { error } = await supabase.from("categories").insert({
      ...parsed.data,
      slug: `${base}-${Math.random().toString(36).slice(2, 6)}`,
      position: (last?.position ?? 0) + 1,
    });
    if (error) return { errors: { form: "Couldn't add the category. Please try again." } };
  }

  refresh();
  return {};
}

export async function deleteCategory(categoryId: string) {
  const { supabase } = await requireOwner();
  // Toys in this category stay in the shop, just without a category.
  await supabase.from("categories").delete().eq("id", categoryId);
  refresh();
}

export async function moveCategory(categoryId: string, direction: "up" | "down") {
  const { supabase } = await requireOwner();
  const { data } = await supabase
    .from("categories")
    .select("id, position")
    .order("position")
    .order("name");
  const list = data ?? [];
  const index = list.findIndex((item) => item.id === categoryId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= list.length) return;

  [list[index], list[swapWith]] = [list[swapWith], list[index]];
  await Promise.all(
    list.map((item, position) =>
      supabase.from("categories").update({ position: position + 1 }).eq("id", item.id),
    ),
  );
  refresh();
}
