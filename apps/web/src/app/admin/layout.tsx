import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Card, TobySays } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Owner pages depend on who is logged in, so never pre-build them.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner area · Toy Shop",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <Card>
          <TobySays title="The owner area isn't connected yet">
            Add the Supabase settings (NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) to this website, then
            redeploy.
          </TobySays>
        </Card>
      </main>
    );
  }

  return children;
}
