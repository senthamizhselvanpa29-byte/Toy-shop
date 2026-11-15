"use client";

import Link from "next/link";
import { saveInvoiceSettings, type InvoiceSettingsInput } from "@/app/admin/(panel)/settings/shopActions";
import { buttonClasses, Card, Field, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { SaveBar, ShopImageFieldSlot, Toggle, useSettingsForm } from "./kit";
import { ShopImageField } from "./ShopImageField";

const MODES = [
  {
    id: "none",
    title: "Not registered for GST",
    text: "Invoices show the total only, with no GST lines. (Right for most new small shops.)",
  },
  {
    id: "regular",
    title: "Registered — regular GST",
    text: "Tax invoices with GSTIN, HSN code and CGST + SGST (same state) or IGST (other states).",
  },
  {
    id: "composition",
    title: "Registered — composition scheme",
    text: "“Bill of supply” with your GSTIN and the composition line the law asks for; no tax is shown.",
  },
] as const;

// "INV/26-27/0007" from the current settings, for the preview line.
function seriesFor(prefix: string, includeYear: boolean) {
  const now = new Date();
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const yy = (year: number) => String(year % 100).padStart(2, "0");
  return `${prefix || "INV"}/${includeYear ? `${yy(start)}-${yy(start + 1)}/` : ""}`;
}

export function InvoiceSettingsForm({ initial, nextPreview }: { initial: InvoiceSettingsInput; nextPreview: string | null }) {
  const form = useSettingsForm(initial, saveInvoiceSettings);
  const { values, set, errors, text } = form;
  const sameSeries = values.prefix.toUpperCase() === initial.prefix && values.includeYear === initial.includeYear;
  const number = values.nextNumber.trim()
    ? values.nextNumber.trim().padStart(4, "0")
    : sameSeries && nextPreview
      ? nextPreview.split("/").pop()
      : "0001";
  const preview = `${seriesFor(values.prefix.toUpperCase(), values.includeYear)}${number}`;

  return (
    <form className="flex flex-col gap-6" onSubmit={form.submit} noValidate>
      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">🧾 GST</h2>
          <Link href="/invoice/preview" target="_blank" className={buttonClasses("secondary", "sm")}>
            👀 See a sample invoice
          </Link>
        </div>
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">GST registration</legend>
          {MODES.map((mode) => (
            <label
              key={mode.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4",
                values.gstMode === mode.id ? "border-sky-dark bg-sky/10" : "border-ink/10 bg-white",
              )}
            >
              <input
                type="radio"
                name="gstMode"
                value={mode.id}
                checked={values.gstMode === mode.id}
                onChange={() => set("gstMode", mode.id)}
                className="mt-1 size-5 accent-sky-dark"
              />
              <span>
                <span className="font-heading text-lg">{mode.title}</span>
                <span className="block text-sm text-ink-soft">{mode.text}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="settings-gstin" label="GSTIN" required={values.gstMode !== "none"} error={errors.gstin} hint="15 characters, from your GST certificate.">
            <Input {...text("gstin", { hint: true })} maxLength={15} placeholder="33ABCDE1234F1Z5" className="uppercase" disabled={values.gstMode === "none"} />
          </Field>
          <Field id="settings-hsn" label="HSN code for your toys" error={errors.hsn} hint="9503 covers most toys.">
            <Input {...text("hsn", { hint: true })} inputMode="numeric" maxLength={8} className="max-w-40" />
          </Field>
          <div className="sm:col-span-2">
            <Field
              id="settings-legalName"
              label="Business name on invoices"
              error={errors.legalName}
              hint="Only if it differs from your shop name — for example the name on your GST certificate."
            >
              <Input {...text("legalName", { hint: true })} maxLength={100} placeholder="Same as the shop name" />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">🔢 Invoice numbers</h2>
        <p className="text-ink-soft">
          Every order gets the next number automatically when it is placed. Numbers are never repeated or changed.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="settings-prefix" label="Starts with" error={errors.prefix} hint="1–6 letters or numbers.">
            <Input {...text("prefix", { hint: true })} maxLength={6} className="max-w-40 uppercase" />
          </Field>
          <Field
            id="settings-nextNumber"
            label="Next number (optional)"
            error={errors.nextNumber}
            hint="Leave empty to keep counting. Fill in only to continue after paper invoices, e.g. 101."
          >
            <Input {...text("nextNumber", { hint: true })} inputMode="numeric" maxLength={6} className="max-w-40" placeholder={nextPreview?.split("/").pop() ?? "1"} />
          </Field>
        </div>
        <Toggle
          id="settings-includeYear"
          checked={values.includeYear}
          onChange={(checked) => set("includeYear", checked)}
          label="Include the financial year and start again from 1 every April"
          hint="Recommended in India (for example INV/26-27/0001)."
        />
        <p className="rounded-2xl bg-mint/20 px-4 py-3" data-next-invoice>
          Next invoice: <strong className="font-heading text-lg">{preview}</strong>
        </p>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">✍️ Signature and notes</h2>
        <div className="flex flex-col gap-2">
          <span className="font-heading text-lg">Signature (optional)</span>
          <ShopImageFieldSlot error={errors.signaturePath}>
            <ShopImageField
              id="settings-signature"
              kind="signature"
              path={values.signaturePath}
              onChange={(path) => set("signaturePath", path)}
              max={600}
              previewClassName="h-14"
              help="Sign on white paper, take a clear photo and upload it. Without one, invoices say they are computer-generated."
            />
          </ShopImageFieldSlot>
        </div>
        <Field id="settings-signatoryName" label="Name under the signature" error={errors.signatoryName}>
          <Input {...text("signatoryName")} maxLength={60} placeholder="Your name" className="max-w-sm" />
        </Field>
        <Field
          id="settings-notes"
          label="Notes at the bottom of every invoice"
          error={errors.notes}
          hint="For example your UPI ID or bank details, a thank-you, or a short return rule."
        >
          <Textarea {...text("notes", { hint: true })} rows={4} maxLength={800} />
        </Field>
      </Card>

      <SaveBar pending={form.pending} saved={form.saved} rounds={form.rounds} error={errors.form} label="Save invoice settings ✓" />
    </form>
  );
}
