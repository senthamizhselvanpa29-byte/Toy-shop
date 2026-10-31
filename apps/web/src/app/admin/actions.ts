"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string; email?: string };

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { email, error: "Please enter your email and password 🙂" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { email, error: "That email or password doesn't match. Try again!" };
  }

  const viewer = await getViewer();
  if (viewer.status !== "owner") {
    await supabase.auth.signOut();
    return { email, error: "This account isn't the shop owner account." };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
