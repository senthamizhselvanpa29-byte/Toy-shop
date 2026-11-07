"use client";

import { useState, useTransition } from "react";
import { cancelMyOrder, requestReturn } from "@/app/(shop)/account/orders/actions";
import { Button, Field, Select } from "@/components/ui";
import type { ActionResult } from "@/lib/orderAdmin";

const CANCEL_REASONS = ["Ordered by mistake", "Found it cheaper elsewhere", "Delivery is too slow", "Want to change the toys", "Other"];
const RETURN_REASONS = ["Toy arrived damaged", "Wrong toy delivered", "Missing parts", "Not as described", "Other"];

export function CustomerOrderActions({
  orderId,
  canCancel,
  canReturn,
  returnDays,
  paidOnline,
}: {
  orderId: string;
  canCancel: boolean;
  canReturn: boolean;
  returnDays: number;
  paidOnline: boolean;
}) {
  const [open, setOpen] = useState<"cancel" | "return" | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canCancel && !canReturn && !message) return null;

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.error ? { kind: "error", text: result.error } : { kind: "ok", text: result.notice ?? success });
      if (!result.error) setOpen(null);
    });
  }

  const reasons = open === "return" ? RETURN_REASONS : CANCEL_REASONS;

  return (
    <div className="flex flex-col gap-3">
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={message.kind === "error" ? "rounded-2xl bg-bubblegum/15 px-4 py-3 font-bold text-bubblegum-dark" : "rounded-2xl bg-mint/25 px-4 py-3 font-bold text-mint-dark"}
        >
          {message.text}
        </p>
      )}

      {!open && (
        <div className="flex flex-wrap gap-2">
          {canCancel && (
            <Button variant="ghost" size="sm" onClick={() => { setOpen("cancel"); setReason(""); }}>
              ✖️ Cancel order
            </Button>
          )}
          {canReturn && (
            <Button variant="ghost" size="sm" onClick={() => { setOpen("return"); setReason(""); }}>
              ↩️ Return toys (within {returnDays} days)
            </Button>
          )}
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-3 rounded-2xl bg-ink/5 p-4">
          <p className="font-bold">
            {open === "cancel"
              ? `Cancel this order?${paidOnline ? " Your money will be refunded to the same payment method (usually 5–7 working days)." : ""}`
              : "Tell us what's wrong and we'll arrange a pickup."}
          </p>
          <Field id="order-reason" label="Reason">
            <Select id="order-reason" value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="" disabled>
                Choose a reason
              </option>
              {reasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button
              variant={open === "cancel" ? "danger" : "primary"}
              disabled={pending || !reason}
              onClick={() =>
                open === "cancel"
                  ? run(() => cancelMyOrder(orderId, reason), "Your order is cancelled.")
                  : run(() => requestReturn(orderId, reason), "Return requested.")
              }
            >
              {pending ? "Please wait…" : open === "cancel" ? "Yes, cancel order" : "Request return"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Go back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
