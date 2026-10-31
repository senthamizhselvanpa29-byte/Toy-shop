// Supabase calls this key "publishable" in new projects and "anon" in older ones;
// either works.
function readEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getSupabaseEnv() {
  const { url, key } = readEnv();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase settings. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see apps/web/.env.example).",
    );
  }

  return { url, anonKey: key };
}

export function isSupabaseConfigured() {
  const { url, key } = readEnv();
  return Boolean(url && key);
}
