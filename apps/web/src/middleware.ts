import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Supabase email links that land on the home page (e.g. "/?code=…") are
  // finished on the login callback page instead of being ignored.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/") {
    if (!searchParams.has("code")) return NextResponse.next();
    const callback = request.nextUrl.clone();
    callback.pathname = "/account/callback";
    callback.search = "";
    callback.searchParams.set("code", searchParams.get("code") ?? "");
    callback.searchParams.set("next", "/account");
    return NextResponse.redirect(callback);
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/", "/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
