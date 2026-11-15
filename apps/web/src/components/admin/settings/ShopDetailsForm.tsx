"use client";

import { INDIAN_STATES } from "@toyshop/shared";
import { saveShopDetails, type ShopDetailsInput } from "@/app/admin/(panel)/settings/shopActions";
import { ShopLogo } from "@/components/shop/ShopLogo";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { productImageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { LanguageFields, SaveBar, ShopImageFieldSlot, Toggle, useSettingsForm } from "./kit";
import { ShopImageField } from "./ShopImageField";

const EMOJIS = ["🧸", "🎈", "🚂", "🧩", "🦄", "🎨", "🪁", "🎁", "⭐", "🪀"];

export function ShopDetailsForm({ initial }: { initial: ShopDetailsInput }) {
  const form = useSettingsForm(initial, saveShopDetails);
  const { values, set, errors, text } = form;
  const setText = (key: "tagline" | "whatsappMessage") => (code: "en" | "ta" | "hi", value: string) =>
    set(key, { ...values[key], [code]: value });

  return (
    <form className="flex flex-col gap-6" onSubmit={form.submit} noValidate>
      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">🏪 Your shop</h2>
        <Field id="settings-name" label="Shop name" required error={errors.name} hint="Shown at the top of every page, in the payment window and on invoices.">
          <Input {...text("name", { hint: true })} maxLength={60} />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="font-heading text-lg">Logo</span>
          <ShopImageFieldSlot error={errors.logoPath}>
            <ShopImageField
              id="settings-logo"
              kind="logo"
              path={values.logoPath}
              onChange={(path) => set("logoPath", path)}
              max={512}
              help="A square or wide picture works best. PNG with a see-through background looks great on every colour."
            />
          </ShopImageFieldSlot>
          {values.logoPath ? (
            <Toggle
              id="settings-showName"
              checked={values.showNameWithLogo}
              onChange={(checked) => set("showNameWithLogo", checked)}
              label="Show the shop name next to the logo"
              hint="Switch off if your logo already contains the name."
            />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink-soft">No logo yet? Pick a fun emoji instead:</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Shop emoji">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-pressed={values.logoEmoji === emoji}
                    onClick={() => set("logoEmoji", emoji)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl text-2xl",
                      values.logoEmoji === emoji ? "bg-sunshine shadow-soft" : "bg-white hover:bg-sunshine/40",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
                <Input {...text("logoEmoji")} aria-label="Or type any emoji" className="w-20 text-center text-2xl" maxLength={8} />
              </div>
              {errors.logoEmoji && <p className="text-sm font-bold text-bubblegum-dark">{errors.logoEmoji}</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-cream p-4" aria-label="Preview">
          <p className="mb-2 text-sm text-ink-soft">Preview of the top of your shop:</p>
          <ShopLogo
            name={values.name || "Your shop"}
            logoUrl={values.logoPath ? productImageUrl(values.logoPath) : null}
            logoEmoji={values.logoEmoji || "🧸"}
            showNameWithLogo={values.showNameWithLogo}
            className="text-2xl"
          />
        </div>

        <LanguageFields
          id="settings-tagline"
          label="Tagline"
          hint="One short line under your name in the footer and on Google."
          placeholder="Happy toys for happy kids, delivered across India."
          values={values.tagline}
          onChange={setText("tagline")}
          maxLength={140}
        />
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">📞 Contact details</h2>
        <p className="text-ink-soft">Shown on your Contact page, in the footer and on invoices. Razorpay asks for these too.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="settings-phone" label="Phone" error={errors.phone}>
            <Input {...text("phone")} inputMode="tel" maxLength={30} placeholder="+91 98765 43210" />
          </Field>
          <Field id="settings-email" label="Email" error={errors.email}>
            <Input {...text("email")} inputMode="email" maxLength={120} placeholder="hello@yourshop.in" />
          </Field>
          <div className="sm:col-span-2">
            <Field id="settings-address" label="Shop address" error={errors.address}>
              <Textarea {...text("address")} rows={3} maxLength={400} />
            </Field>
          </div>
          <Field id="settings-state" label="State" error={errors.state} hint="Also decides CGST + SGST or IGST on tax invoices.">
            <Select {...text("state", { hint: true })}>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            id="settings-grievanceOfficer"
            label="Grievance officer"
            error={errors.grievanceOfficer}
            hint="Indian e-commerce rules ask shops to name the person who handles complaints (often the owner)."
          >
            <Input {...text("grievanceOfficer", { hint: true })} maxLength={80} placeholder="Your name" />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">💬 WhatsApp chat button</h2>
        <Toggle
          id="settings-whatsappEnabled"
          checked={values.whatsappEnabled}
          onChange={(checked) => set("whatsappEnabled", checked)}
          label="Show a green WhatsApp button on every shop page"
          hint="Customers tap it to message you. The message includes the page they were looking at."
        />
        <Field id="settings-whatsappNumber" label="WhatsApp number" error={errors.whatsappNumber}>
          <Input {...text("whatsappNumber")} inputMode="tel" maxLength={20} placeholder="98765 43210" className="max-w-60" />
        </Field>
        <LanguageFields
          id="settings-whatsappMessage"
          label="Ready-made first message"
          placeholder="Hi! I have a question about your toys."
          values={values.whatsappMessage}
          onChange={setText("whatsappMessage")}
          maxLength={300}
        />
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">📱 Social media</h2>
        <p className="text-ink-soft">Paste the links to your pages. Empty ones are not shown.</p>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="settings-instagram" label="Instagram" error={errors.instagram}>
            <Input {...text("instagram")} inputMode="url" placeholder="https://instagram.com/yourshop" />
          </Field>
          <Field id="settings-facebook" label="Facebook" error={errors.facebook}>
            <Input {...text("facebook")} inputMode="url" placeholder="https://facebook.com/yourshop" />
          </Field>
          <Field id="settings-youtube" label="YouTube" error={errors.youtube}>
            <Input {...text("youtube")} inputMode="url" placeholder="https://youtube.com/@yourshop" />
          </Field>
        </div>
      </Card>

      <SaveBar pending={form.pending} saved={form.saved} rounds={form.rounds} error={errors.form} label="Save shop details ✓" />
    </form>
  );
}
