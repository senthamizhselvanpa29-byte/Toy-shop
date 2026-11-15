import { notFound } from "next/navigation";

// Any shop address that doesn't exist shows the friendly "not found" page in
// the shopper's language (instead of the plain English one).
export default function UnknownShopPage() {
  notFound();
}
