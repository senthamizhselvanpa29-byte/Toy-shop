"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resetShopPage, saveShopPage, type PageInput } from "@/app/admin/(panel)/settings/shopActions";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { SaveBar, useSettingsForm } from "./kit";

const LANGS = [
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ்" },
  { code: "hi", label: "हिंदी" },
] as const;

export function PageEditor({
  slug,
  isDraft,
  draft,
  placeholders,
  initial,
}: {
  slug: string;
  isDraft: boolean;
  draft: { title: string; body: string };
  placeholders: { key: string; label: string; value: string }[];
  initial: PageInput;
}) {
  const router = useRouter();
  const form = useSettingsForm(initial, saveShopPage);
  const { values, set, errors } = form;
  const [lang, setLang] = useState<"en" | "ta" | "hi">("en");
  const [resetting, startReset] = useTransition();
  const field = (key: "title" | "body") => ({
    value: values[key][lang],
    lang,
    onChange: (event: { target: { value: string } }) => set(key, { ...values[key], [lang]: event.target.value }),
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={form.submit} noValidate>
      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Language">
          {LANGS.map((item) => (
            <button
              key={item.code}
              type="button"
              role="tab"
              aria-selected={lang === item.code}
              onClick={() => setLang(item.code)}
              className={cn("rounded-full px-4 py-1.5 font-bold", lang === item.code ? "bg-ink text-white" : "bg-ink/5")}
            >
              {item.label}
              {item.code !== "en" && values.body[item.code].trim() && " ✓"}
            </button>
          ))}
        </div>
        {lang !== "en" && (
          <p className="rounded-2xl bg-sky/10 px-4 py-3 text-sm">
            Optional. While this is empty, {lang === "ta" ? "Tamil" : "Hindi"} visitors see the English page.
          </p>
        )}
        <Field id={`page-title-${lang}`} label="Title" error={lang === "en" ? errors.title : undefined} required={lang === "en"}>
          <Input id={`page-title-${lang}`} {...field("title")} maxLength={100} />
        </Field>
        <Field id={`page-body-${lang}`} label="Text" error={lang === "en" ? errors.body : undefined} required={lang === "en"}>
          <Textarea id={`page-body-${lang}`} {...field("body")} rows={20} className="font-mono text-sm leading-relaxed" />
        </Field>
        <details className="rounded-2xl bg-cream p-4 text-sm">
          <summary className="cursor-pointer font-bold">✏️ How to format, and the words that fill in by themselves</summary>
          <ul className="mt-2 ml-5 list-disc space-y-1">
            <li>
              <code>## Heading</code> starts a heading, <code>- </code> a bullet point, <code>**words**</code> makes words bold.
            </li>
            <li>An empty line starts a new paragraph. Web links and email addresses become clickable.</li>
          </ul>
          <p className="mt-3 font-bold">Type these and the shop fills them in from your settings:</p>
          <ul className="mt-1 grid gap-1 sm:grid-cols-2">
            {placeholders.map((p) => (
              <li key={p.key}>
                <code>{`{${p.key}}`}</code> → {p.value || <em className="text-bubblegum-dark">not filled in yet</em>}
              </li>
            ))}
          </ul>
        </details>
      </Card>
      <SaveBar pending={form.pending} saved={form.saved} rounds={form.rounds} error={errors.form} label="Save page ✓" />
      <div className="flex flex-wrap items-center gap-3">
        {isDraft ? (
          <p className="text-sm text-ink-soft">💡 This is the suggested text. Saving makes it your own version.</p>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={resetting}
            onClick={() => {
              if (!window.confirm("Replace your text with the suggested text? Your changes to this page will be lost.")) return;
              startReset(async () => {
                await resetShopPage(slug);
                set("title", { en: draft.title, ta: "", hi: "" });
                set("body", { en: draft.body, ta: "", hi: "" });
                router.refresh();
              });
            }}
          >
            ↺ Use the suggested text again
          </Button>
        )}
      </div>
    </form>
  );
}
