import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, isPlainPath, LOCALE_COOKIE, localePath, stripLocale } from "@/lib/locales";
import { updateSession } from "@/lib/supabase/middleware";

// Pages inside protected areas that anyone may open.
const OPEN_PAGES = ["/account/login", "/admin/login"];
const LOGIN_AREAS = ["/admin", "/account", "/checkout", "/invoice"];

function needsLogin(path: string): boolean {
  if (OPEN_PAGES.includes(path)) return false;
  return LOGIN_AREAS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const { pathname, searchParams } = url;

  // Supabase email links that land on the home page (e.g. "/?code=…") are
  // finished on the login callback instead of being ignored.
  if (pathname === "/" && searchParams.has("code")) {
    const callback = url.clone();
    callback.pathname = "/account/callback";
    callback.search = "";
    callback.searchParams.set("code", searchParams.get("code") ?? "");
    callback.searchParams.set("next", "/account");
    return NextResponse.redirect(callback);
  }

  // Owner area, invoices and APIs have no language in their address.
  if (isPlainPath(pathname)) {
    if (!needsLogin(pathname)) return NextResponse.next();
    const login = url.clone();
    if (pathname.startsWith("/admin")) {
      login.pathname = "/admin/login";
      login.search = "";
    } else {
      login.pathname = "/account/login";
      login.search = `?next=${encodeURIComponent(pathname + url.search)}`;
    }
    return updateSession(request, { loginUrl: login });
  }

  const { locale, path } = stripLocale(pathname);

  const isPageView = request.method === "GET" || request.method === "HEAD";

  // English has no prefix: "/en/toys" → "/toys".
  if (locale === DEFAULT_LOCALE && isPageView) {
    const clean = url.clone();
    clean.pathname = path;
    return NextResponse.redirect(clean, 308);
  }

  // A shopper who chose Tamil or Hindi before gets their language back.
  if (!locale && isPageView) {
    const remembered = request.cookies.get(LOCALE_COOKIE)?.value;
    if (isLocale(remembered) && remembered !== DEFAULT_LOCALE) {
      const to = url.clone();
      to.pathname = localePath(remembered, path);
      return NextResponse.redirect(to);
    }
  }

  // Inside the app, English pages live at "/en/…".
  let rewriteTo: URL | undefined;
  if (!locale || locale === DEFAULT_LOCALE) {
    rewriteTo = url.clone();
    rewriteTo.pathname = path === "/" ? "/en" : `/en${path}`;
  }

  // Public pages need no login check (and no network call).
  if (!needsLogin(path)) {
    return rewriteTo ? NextResponse.rewrite(rewriteTo) : NextResponse.next();
  }

  const login = url.clone();
  login.pathname = localePath(locale ?? DEFAULT_LOCALE, "/account/login");
  login.search = `?next=${encodeURIComponent(pathname + url.search)}`;
  return updateSession(request, { loginUrl: login, rewriteTo });
}

export const config = {
  // Every page, but not Next.js or Vercel internals, or files such as images.
  matcher: ["/((?!_next/|_vercel/|.*\\..*).*)"],
};
