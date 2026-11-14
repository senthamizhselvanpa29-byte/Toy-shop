import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@toyshop/shared";
import { CustomerLoginForm } from "@/components/account/CustomerLoginForm";
import { Card } from "@/components/ui";
import { getT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Log in · Toy Shop",
  robots: { index: false },
};

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNextPath(rawNext);
  const t = await getT();

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect(next);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-12">
      <div className="text-center">
        <div className="text-6xl" aria-hidden>
          🧸👋
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl">{t("login.welcome")}</h1>
        <p className="mt-1 text-ink-soft">
          {t("login.subtitle")}
        </p>
      </div>
      <Card>
        {error && (
          <p role="alert" className="mb-4 rounded-2xl bg-bubblegum/15 px-4 py-3 font-bold text-bubblegum-dark">
            {t("login.notFinished")}
          </p>
        )}
        <CustomerLoginForm next={next} />
      </Card>
      <p className="text-center text-sm text-ink-soft">
        {t("login.newHere")}
      </p>
    </div>
  );
}
