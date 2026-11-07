import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

// Server-only client with full database access, for writes that customers must
// never make themselves (creating orders, marking them paid). Never import this
// into a Client Component, and never expose SUPABASE_SECRET_KEY to the browser.
export function isAdminConfigured() {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}

export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set");
  const { url } = getSupabaseEnv();
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
