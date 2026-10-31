import "server-only";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type Viewer =
  | { status: "signed-out" }
  | { status: "customer"; user: User }
  | { status: "owner"; user: User; fullName: string | null };

// Who is looking at the page, and are they the shop owner?
export async function getViewer(): Promise<Viewer> {
  if (!isSupabaseConfigured()) return { status: "signed-out" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "signed-out" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "owner") {
    return { status: "owner", user, fullName: profile.full_name };
  }
  return { status: "customer", user };
}

// For Server Actions that change shop data. The database rules enforce the same
// thing; this gives a clear error early.
export async function requireOwner() {
  const viewer = await getViewer();
  if (viewer.status !== "owner") {
    throw new Error("Only the shop owner can do this.");
  }
  return { supabase: await createClient(), user: viewer.user };
}
