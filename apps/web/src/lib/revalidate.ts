import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/shop";

// Call after anything customers can see changes (toys, prices, stock,
// categories, settings): refreshes the cached toy list and every shop page.
export function refreshCatalog() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}
