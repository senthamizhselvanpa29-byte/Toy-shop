"use client";

import { useState, useTransition } from "react";
import { saveShopSettings, type SettingsInput } from "@/app/admin/(panel)/settings/actions";
import { INDIAN_STATES } from "@toyshop/shared";
import { Button, Card, describedBy, Field, Input, Select, Textarea } from "@/components/ui";

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const bind = (key: "deliveryFee" | "freeDeliveryAbove" | "codMax", hint?: boolean) => ({
    id: `settings-${key}`,
    value: values[key],
    inputMode: "decimal" as const,
    onChange: (event: { target: { value: string } }) => {
      setValues({ ...values, [key]: event.target.value });
      setSaved(false);
    },
    ...describedBy(`settings-${key}`, { error: errors[key], hint: hint ? "yes" : undefined }),
  });

  type TextKey = "businessName" | "businessAddress" | "businessState" | "businessPhone" | "businessEmail" | "gstin" | "returnDays";
  const text = (key: TextKey, hint?: boolean) => ({
    id: `settings-${key}`,
    value: values[key],
    onChange: (event: { target: { value: string } }) => {
      setValues({ ...values, [key]: event.target.value });
      setSaved(false);
    },
    ...describedBy(`settings-${key}`, { error: errors[key], hint: hint ? "yes" : undefined }),
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await saveShopSettings(values);
          setErrors(result.errors ?? {});
          setSaved(Boolean(result.ok));
        });
      }}
    >
      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">🚚 Delivery charges</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="settings-deliveryFee" label="Delivery fee (₹)" error={errors.deliveryFee} hint="Charged on small orders. 0 = always free.">
            <Input {...bind("deliveryFee", true)} />
          </Field>
          <Field
            id="settings-freeDeliveryAbove"
            label="Free delivery on orders from (₹)"
            error={errors.freeDeliveryAbove}
            hint="0 = never free (fee always charged)."
          >
            <Input {...bind("freeDeliveryAbove", true)} />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">💵 Cash on delivery</h2>
        <label className="flex cursor-pointer items-center gap-3 text-lg">
          <input
            type="checkbox"
            checked={values.codEnabled}
            onChange={(event) => {
              setValues({ ...values, codEnabled: event.target.checked });
              setSaved(false);
            }}
            className="size-5 accent-bubblegum-dark"
          />
          Let customers pay in cash when the toys arrive
        </label>
        <Field id="settings-codMax" label="Largest order allowed for cash on delivery (₹)" error={errors.codMax} hint="Bigger orders must be paid online.">
          <Input {...bind("codMax", true)} disabled={!values.codEnabled} />
        </Field>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">🧾 Business details (shown on invoices)</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="settings-businessName" label="Shop / business name" required error={errors.businessName}>
            <Input {...text("businessName")} maxLength={100} />
          </Field>
          <Field id="settings-gstin" label="GSTIN" error={errors.gstin} hint="Leave empty if you don't have one yet — invoices then show as receipts.">
            <Input {...text("gstin", true)} maxLength={15} placeholder="33ABCDE1234F1Z5" className="uppercase" />
          </Field>
          <div className="sm:col-span-2">
            <Field id="settings-businessAddress" label="Business address" error={errors.businessAddress}>
              <Textarea {...text("businessAddress")} rows={3} maxLength={400} />
            </Field>
          </div>
          <Field id="settings-businessState" label="State" error={errors.businessState} hint="Used to choose CGST + SGST or IGST.">
            <Select {...text("businessState", true)}>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="settings-businessPhone" label="Phone" error={errors.businessPhone}>
            <Input {...text("businessPhone")} inputMode="tel" maxLength={30} />
          </Field>
          <Field id="settings-businessEmail" label="Email" error={errors.businessEmail}>
            <Input {...text("businessEmail")} inputMode="email" maxLength={120} />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">↩️ Returns</h2>
        <Field id="settings-returnDays" label="Days customers have to request a return after delivery" error={errors.returnDays} hint="0 = no returns.">
          <Input {...text("returnDays", true)} inputMode="numeric" className="max-w-32" />
        </Field>
      </Card>

      {errors.form && <p role="alert" className="font-bold text-bubblegum-dark">{errors.form}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save settings ✓"}
        </Button>
        {saved && <span role="status" className="font-bold text-mint-dark">Saved ✓ — the shop uses these now.</span>}
      </div>
    </form>
  );
}
