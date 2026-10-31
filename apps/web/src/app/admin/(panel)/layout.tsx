import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button, buttonClasses, Card, TobySays } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { signOut } from "../actions";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const viewer = await getViewer();

  if (viewer.status === "signed-out") redirect("/admin/login");

  if (viewer.status === "customer") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <Card>
          <TobySays
            title="This area is only for the shop owner"
            action={
              <form action={signOut}>
                <Button type="submit" variant="secondary">
                  Log out
                </Button>
              </form>
            }
          >
            You&apos;re logged in as {viewer.user.email}.
          </TobySays>
        </Card>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2 font-heading text-2xl">
          <span aria-hidden>🧸</span> Toy Shop <span className="text-bubblegum-dark">Owner</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-soft sm:inline">{viewer.user.email}</span>
          <Link href="/" className={buttonClasses("ghost", "sm")}>
            View shop
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="secondary" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-12 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
