import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay keys live in Vercel → Settings → Environment Variables:
// RAZORPAY_KEY_ID (starts rzp_test_ or rzp_live_), RAZORPAY_KEY_SECRET and
// RAZORPAY_WEBHOOK_SECRET. The secret ones are never sent to the browser.
const API_BASE = process.env.RAZORPAY_API_BASE ?? "https://api.razorpay.com";

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
  ).toString("base64");

  const response = await fetch(`${API_BASE}/v1/orders`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Razorpay order failed (${response.status})`);
  }
  return response.json();
}

function safeEqualHex(expected: string, received: string) {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Checks the signature Razorpay Checkout returns after a successful payment.
export function isValidPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

// Checks that a webhook really came from Razorpay.
export function isValidWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
