import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@toyshop/shared";
import { localePath, stripLocale } from "@/lib/locales";
import { createClient } from "@/lib/supabase/server";

// Google sign-in returns here with a one-time code, which becomes a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  const login = localePath(stripLocale(next).locale ?? "en", "/account/login");
  return NextResponse.redirect(`${origin}${login}?error=1&next=${encodeURIComponent(next)}`);
}
