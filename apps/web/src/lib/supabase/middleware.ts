import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "./env";

export type SessionOptions = {
  // Where to send a signed-out visitor. Leave out for pages anyone may open.
  loginUrl?: URL;
  // Serve a different page inside the app (e.g. "/toys" is really "/en/toys").
  rewriteTo?: URL;
};

// Refreshes the Supabase session cookie and sends signed-out visitors of the
// owner area or customer pages to the right login page.
export async function updateSession(request: NextRequest, options: SessionOptions = {}) {
  const respond = () =>
    options.rewriteTo ? NextResponse.rewrite(options.rewriteTo, { request }) : NextResponse.next({ request });

  if (!isSupabaseConfigured()) return respond();

  const { url, anonKey } = getSupabaseEnv();
  let response = respond();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = respond();
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
          response.cookies.set(name, value, cookieOptions),
        );
      },
    },
  });

  // Must run right after creating the client so the session stays fresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && options.loginUrl) return NextResponse.redirect(options.loginUrl);
  return response;
}
