import Link from "next/link";
import { buttonClasses, TobySays } from "@/components/ui";
import { getT } from "@/lib/i18n";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <TobySays
        title={t("notFound.title")}
        action={
          <Link href="/toys" className={buttonClasses("primary", "lg")}>
            {t("notFound.back")} 🧸
          </Link>
        }
      >
        {t("notFound.text")}
      </TobySays>
    </main>
  );
}
