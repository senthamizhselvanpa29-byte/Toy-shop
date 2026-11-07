"use client";

import { useState, useTransition } from "react";
import {
  advanceOrder,
  cancelOrderAsOwner,
  saveOwnerNote,
  updateReturn,
} from "@/app/admin/(panel)/orders/actions";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import type { ActionResult } from "@/lib/orderAdmin";

type Props = {
  orderId: string;
  status: string;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: string;
  returnStatus: string;
  ownerNote: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
};

export function OrderActions(props: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [shipping, setShipping] = useState({
    courierName: props.courierName,
    trackingNumber: props.trackingNumber,
    trackingUrl: props.trackingUrl,
  });
  const [note, setNote] = useState(props.ownerNote);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  function run(action: () => Promise<ActionResult>, success: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setMessage({ kind: "error", text: result.error });
      else setMessage({ kind: "ok", text: result.notice ?? success });
    });
  }

  const canCancel = ["placed", "packed", "shipped"].includes(props.status);
  const paidOnline = props.paymentMethod === "razorpay" && props.paymentStatus === "paid";

  return (
    <Card className="flex flex-col gap-5 border-sunshine-dark">
      <h2 className="text-2xl">What&apos;s next?</h2>

      {props.status === "placed" && (
        <div className="flex flex-col gap-2">
          <p className="text-ink-soft">Pick the toys, pack them nicely, then tap:</p>
          <Button size="lg" disabled={pending} onClick={() => run(() => advanceOrder(props.orderId, "packed"), "Marked as packed 📦")}>
            📦 Mark as packed
          </Button>
        </div>
      )}

      {props.status === "packed" && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => advanceOrder(props.orderId, "shipped", shipping), "Marked as shipped 🚚 — the customer can see the tracking details.");
          }}
        >
          <p className="text-ink-soft">Handed it to the courier? Add the tracking details (optional) and tap Shipped.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ship-courier" label="Courier">
              <Input
                id="ship-courier"
                value={shipping.courierName}
                placeholder="e.g. India Post, Delhivery, DTDC"
                onChange={(event) => setShipping({ ...shipping, courierName: event.target.value })}
              />
            </Field>
            <Field id="ship-tracking" label="Tracking number">
              <Input
                id="ship-tracking"
                value={shipping.trackingNumber}
                onChange={(event) => setShipping({ ...shipping, trackingNumber: event.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field id="ship-url" label="Tracking link">
                <Input
                  id="ship-url"
                  value={shipping.trackingUrl}
                  placeholder="https://…"
                  inputMode="url"
                  onChange={(event) => setShipping({ ...shipping, trackingUrl: event.target.value })}
                />
              </Field>
            </div>
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            🚚 Mark as shipped
          </Button>
        </form>
      )}

      {props.status === "shipped" && (
        <div className="flex flex-col gap-2">
          <p className="text-ink-soft">
            {props.paymentMethod === "cod"
              ? "When the customer has the toys and the cash is collected, tap:"
              : "When the customer has received the toys, tap:"}
          </p>
          <Button size="lg" disabled={pending} onClick={() => run(() => advanceOrder(props.orderId, "delivered"), "Marked as delivered 🏠")}>
            🏠 Mark as delivered{props.paymentMethod === "cod" ? " (cash collected)" : ""}
          </Button>
        </div>
      )}

      {props.returnStatus === "requested" && (
        <div className="flex flex-col gap-2 rounded-2xl bg-orange/15 p-4">
          <p className="font-bold">↩️ The customer asked to return this order.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="success" disabled={pending} onClick={() => run(() => updateReturn(props.orderId, "approve"), "Return approved — arrange the pickup.")}>
              ✓ Approve return
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => run(() => updateReturn(props.orderId, "reject"), "Return not accepted.")}>
              Don&apos;t accept
            </Button>
          </div>
        </div>
      )}
      {props.returnStatus === "approved" && (
        <div className="flex flex-col gap-2 rounded-2xl bg-orange/15 p-4">
          <p className="font-bold">↩️ Return approved. When the toys are back with you:</p>
          <Button
            disabled={pending}
            onClick={() => {
              if (window.confirm("Mark as returned? The toys go back into stock and the payment is refunded.")) {
                run(() => updateReturn(props.orderId, "complete"), "Returned — toys back in stock and payment refunded.");
              }
            }}
          >
            ✓ Toys received — refund now
          </Button>
        </div>
      )}

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? "rounded-2xl bg-bubblegum/15 px-4 py-3 font-bold text-bubblegum-dark" : "rounded-2xl bg-mint/25 px-4 py-3 font-bold text-mint-dark"}>
          {message.text}
        </p>
      )}

      <form
        className="flex flex-col gap-2 border-t-2 border-dashed border-ink/10 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => saveOwnerNote(props.orderId, note), "Note saved.");
        }}
      >
        <Field id="owner-note" label="Private note (only you can see it)">
          <Textarea id="owner-note" value={note} rows={2} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Gift wrap requested on phone" />
        </Field>
        <Button type="submit" variant="ghost" size="sm" className="self-start" disabled={pending}>
          Save note
        </Button>
      </form>

      {canCancel && (
        <div className="border-t-2 border-dashed border-ink/10 pt-4">
          {!confirmCancel ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(true)}>
              ✖️ Cancel this order…
            </Button>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl bg-bubblegum/10 p-4">
              <p className="font-bold">
                Cancel this order? The toys go back into stock
                {paidOnline ? " and the payment is refunded automatically through Razorpay." : "."}
              </p>
              <Field id="cancel-reason" label="Reason (the customer will see this)">
                <Input id="cancel-reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="e.g. Out of stock, sorry!" />
              </Field>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  disabled={pending}
                  onClick={() => run(() => cancelOrderAsOwner(props.orderId, cancelReason), "Order cancelled.")}
                >
                  Yes, cancel order
                </Button>
                <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
                  Keep order
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
