"use client";

import { saveBannerSettings, type BannerInput } from "@/app/admin/(panel)/settings/shopActions";
import { Card, Field, Input } from "@/components/ui";
import { bgColor, type ThemeColor } from "@/components/ui/colors";
import { cn } from "@/lib/cn";
import { LanguageFields, SaveBar, Toggle, useSettingsForm } from "./kit";

const COLORS: { id: ThemeColor; label: string }[] = [
  { id: "sunshine", label: "Yellow" },
  { id: "sky", label: "Blue" },
  { id: "bubblegum", label: "Pink" },
  { id: "mint", label: "Green" },
  { id: "orange", label: "Orange" },
  { id: "grape", label: "Purple" },
];

export function BannerForm({ initial }: { initial: BannerInput }) {
  const form = useSettingsForm(initial, saveBannerSettings);
  const { values, set, errors, text } = form;
  const setText = (key: "announcement" | "pausedMessage") => (code: "en" | "ta" | "hi", value: string) =>
    set(key, { ...values[key], [code]: value });

  return (
    <form className="flex flex-col gap-6" onSubmit={form.submit} noValidate>
      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl">📣 Banner at the top of the shop</h2>
        <p className="text-ink-soft">Tell every visitor about a sale, a festival offer or free delivery.</p>
        <Toggle
          id="settings-announcementEnabled"
          checked={values.announcementEnabled}
          onChange={(checked) => set("announcementEnabled", checked)}
          label="Show the banner"
        />
        <LanguageFields
          id="settings-announcement"
          label="Message"
          placeholder="🪔 Diwali sale — 20% off all puzzles!"
          error={errors.announcement}
          values={values.announcement}
          onChange={setText("announcement")}
          maxLength={160}
        />
        <Field
          id="settings-announcementLink"
          label="Link (optional)"
          error={errors.announcementLink}
          hint="Where a tap on the banner goes: a page of your shop like /toys?category=puzzles, or a full https:// link."
        >
          <Input {...text("announcementLink", { hint: true })} maxLength={300} placeholder="/toys?sort=discount" />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="font-heading text-lg">Colour</legend>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <label
                key={color.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-bold has-focus-visible:outline-2 has-focus-visible:outline-sky-dark",
                  bgColor[color.id],
                  values.announcementColor === color.id && "ring-4 ring-ink",
                )}
              >
                <input
                  type="radio"
                  name="announcementColor"
                  value={color.id}
                  checked={values.announcementColor === color.id}
                  onChange={() => set("announcementColor", color.id)}
                  className="sr-only"
                />
                {color.label}
              </label>
            ))}
          </div>
        </fieldset>
        {values.announcement.en.trim() && (
          <div>
            <p className="mb-1 text-sm text-ink-soft">Preview:</p>
            <div className={cn("rounded-xl px-4 py-2 text-center text-sm font-bold", bgColor[values.announcementColor as ThemeColor] ?? "bg-sunshine")}>
              {values.announcement.en}
              {values.announcementLink && " →"}
            </div>
          </div>
        )}
      </Card>

      <Card className={cn("flex flex-col gap-5", values.orderingPaused && "ring-4 ring-bubblegum-dark")}>
        <h2 className="text-2xl">⏸️ Holiday mode</h2>
        <p className="text-ink-soft">
          Going away or too busy? Pause new orders. Customers can still look around and save toys to their wishlist; a
          notice at the top of every page explains why they can&apos;t order. Orders you already have are not affected.
        </p>
        <Toggle
          id="settings-orderingPaused"
          checked={values.orderingPaused}
          onChange={(checked) => set("orderingPaused", checked)}
          label={<strong>Pause new orders</strong>}
        />
        <LanguageFields
          id="settings-pausedMessage"
          label="Message for customers"
          placeholder="We're on holiday until 5 November. Orders open again soon!"
          values={values.pausedMessage}
          onChange={setText("pausedMessage")}
          maxLength={240}
        />
      </Card>

      <SaveBar pending={form.pending} saved={form.saved} rounds={form.rounds} error={errors.form} label="Save banner & holiday mode ✓" />
    </form>
  );
}
