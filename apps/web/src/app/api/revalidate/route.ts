import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { refreshCatalog } from "@/lib/revalidate";

// Rebuilds the ready-made shop pages when something changed outside the owner
// area (for example a database webhook, or the future mobile owner app).
// Off unless REVALIDATE_SECRET is set; callers send it as a Bearer token.
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sent = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(sent), digest(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  refreshCatalog();
  return NextResponse.json({ ok: true });
}
