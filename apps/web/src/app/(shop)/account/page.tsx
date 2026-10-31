import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatIndianMobile } from "@toyshop/shared";
import { AddressBook, type Address } from "@/components/account/AddressBook";
import { LogoutButton } from "@/components/account/LogoutButton";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My account · Toy Shop", robots: { index: false } };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");

  const [{ data: profile }, { data: addresses }, { count: wishlistCount }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase
      .from("addresses")
      .select("id, label, full_name, phone, line1, line2, landmark, city, state, pincode, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("wishlist_items").select("product_id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const name = profile?.full_name ?? "";
  const loginId = user.email ?? (user.phone ? formatIndianMobile(`+${user.phone.replace(/^\+/, "")}`) : "");

  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Hi{name ? `, ${name.split(" ")[0]}` : ""}! 👋</h1>
          <p className="text-ink-soft">Logged in as {loginId}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/account/wishlist" className="rounded-bubble bg-bubblegum p-5 shadow-soft transition hover:-translate-y-1">
          <span className="text-3xl" aria-hidden>❤️</span>
          <p className="font-heading text-xl">My wishlist</p>
          <p className="text-sm">{wishlistCount ?? 0} saved toy(s)</p>
        </Link>
        <div className="rounded-bubble bg-sky/40 p-5 shadow-soft">
          <span className="text-3xl" aria-hidden>📦</span>
          <p className="font-heading text-xl">My orders</p>
          <p className="text-sm text-ink-soft">Your orders will appear here once online ordering opens.</p>
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-2xl">Your details</h2>
        <ProfileForm fullName={name} phone={profile?.phone ? profile.phone.replace(/^\+91/, "") : ""} />
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">📍 Delivery addresses</h2>
        <AddressBook addresses={(addresses ?? []) as Address[]} defaultName={name} defaultPhone={profile?.phone ?? ""} />
      </section>
    </div>
  );
}
