import Link from "next/link";
import { buttonClasses, TobySays } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <TobySays
        title="Oops! Toby couldn't find that page"
        action={
          <Link href="/toys" className={buttonClasses("primary", "lg")}>
            Back to the toys 🧸
          </Link>
        }
      >
        It may have moved, or the toy is no longer in the shop.
      </TobySays>
    </main>
  );
}
