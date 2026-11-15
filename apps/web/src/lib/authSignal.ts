// A tiny, dependency-free way to tell whether a shopper is signed in, so shop
// pages don't have to download the database client for visitors who aren't.

// Supabase keeps the session in a cookie called "sb-<project>-auth-token"
// (long sessions are split into "….0", "….1").
const AUTH_COOKIE = /(?:^|;\s*)sb-[^=;]*-auth-token/;

export function hasAuthCookie(): boolean {
  return AUTH_COOKIE.test(document.cookie);
}

export const AUTH_CHANGED_EVENT = "toyshop:auth-changed";

// Call right after logging in or out, so the header and wishlist catch up.
export function announceAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
