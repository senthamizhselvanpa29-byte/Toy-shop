import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "./env";

// Pages that need a signed-in person, and where to send them otherwise.
const PROTECTED = [
  { prefix: "/admin", login: "/admin/login", open: ["/admin/login"] },
  { prefix: "/account", login: "/account/login", open: ["/account/login", "/account/callback"] },
];

// Refreshes the Supabase session cookie and sends signed-out visitors of the
// owner area or customer account pages to the right login page.
export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Must run right after creating the client so the session stays fresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const area = PROTECTED.find((item) => pathname.startsWith(item.prefix));
  if (!user && area && !area.open.includes(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = area.login;
    loginUrl.search = area.prefix === "/account" ? `?next=${encodeURIComponent(pathname + search)}` : "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
