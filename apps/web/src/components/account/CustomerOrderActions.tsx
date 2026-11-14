"use client";

import { useState, useTransition } from "react";
import { cancelMyOrder, requestReturn } from "@/app/[locale]/account/orders/actions";
import { useT } from "@/components/i18n/I18nProvider";
import { Button, Field, Select } from "@/components/ui";
import type { ActionResult } from "@/lib/orderAdmin";

// Reasons are saved in English (the owner's language) and shown translated.
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
  const { t } = useT();

  if (!canCancel && !canReturn && !message) return null;

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.error ? { kind: "error", text: t(result.error, result.vars) } : { kind: "ok", text: t(result.notice ?? success, result.vars) });
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
              ✖️ {t("order.cancel")}
            </Button>
          )}
          {canReturn && (
            <Button variant="ghost" size="sm" onClick={() => { setOpen("return"); setReason(""); }}>
              ↩️ {t("order.returnWithin", { days: returnDays })}
            </Button>
          )}
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-3 rounded-2xl bg-ink/5 p-4">
          <p className="font-bold">
            {open === "cancel"
              ? `${t("order.cancelConfirm")}${paidOnline ? ` ${t("order.cancelRefundNote")}` : ""}`
              : t("order.returnPrompt")}
          </p>
          <Field id="order-reason" label={t("order.reasonLabel")}>
            <Select id="order-reason" value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="" disabled>
                {t("order.chooseReason")}
              </option>
              {reasons.map((item) => (
                <option key={item} value={item}>
                  {t(`reason.${item}`)}
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
                  ? run(() => cancelMyOrder(orderId, reason), "order.cancelledOk")
                  : run(() => requestReturn(orderId, reason), "order.returnOk")
              }
            >
              {pending ? t("common.wait") : open === "cancel" ? t("order.cancelYes") : t("order.requestReturn")}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              {t("common.back")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
