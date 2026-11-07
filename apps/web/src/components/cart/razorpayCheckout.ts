"use client";

import type { RazorpayCheckout } from "@/app/(shop)/checkout/actions";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Opens Razorpay's payment window. Resolves "paid" once our server has checked
// the payment, "closed" if the customer closed the window, or "failed".
export async function payWithRazorpay(orderId: string, checkout: RazorpayCheckout): Promise<"paid" | "closed" | "failed"> {
  if (!(await loadScript()) || !window.Razorpay) return "failed";

  return new Promise((resolve) => {
    const razorpay = new window.Razorpay!({
      key: checkout.keyId,
      amount: checkout.amountPaise,
      currency: "INR",
      name: "Toy Shop",
      description: `Order ${checkout.orderNumber}`,
      order_id: checkout.razorpayOrderId,
      prefill: checkout.prefill,
      theme: { color: "#D81B72" },
      handler: async (response: RazorpayResponse) => {
        const result = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, ...response }),
        })
          .then((res) => res.json())
          .catch(() => ({ ok: false }));
        resolve(result.ok ? "paid" : "failed");
      },
      modal: { ondismiss: () => resolve("closed") },
    });
    razorpay.open();
  });
}
