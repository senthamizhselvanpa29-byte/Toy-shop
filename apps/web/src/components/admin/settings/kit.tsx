"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button, describedBy, Field, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";

export type SaveResult = { errors?: Record<string, string>; ok?: boolean; notice?: string };

// State, saving and error messages for one settings form.
export function useSettingsForm<T extends Record<string, unknown>>(initial: T, save: (values: T) => Promise<SaveResult>) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  // How many saves have finished (lets automated checks wait for a save).
  const [rounds, setRounds] = useState(0);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof T>(key: K, value: T[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(null);
  }

  // Props for a text box bound to `key`.
  function text(key: keyof T & string, options: { hint?: boolean } = {}) {
    return {
      id: `settings-${key}`,
      value: String(values[key] ?? ""),
      onChange: (event: { target: { value: string } }) => set(key, event.target.value as T[typeof key]),
      ...describedBy(`settings-${key}`, { error: errors[key], hint: options.hint ? "yes" : undefined }),
    };
  }

  function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    startTransition(async () => {
      const result = await save(values);
      setErrors(result.errors ?? {});
      setSaved(result.ok ? (result.notice ?? "Saved ✓ — your shop shows this now.") : null);
      setRounds((count) => count + 1);
      if (result.errors) {
        // Bring the first problem into view.
        requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true], [data-form-error]")?.focus());
      }
    });
  }

  return { values, set, errors, saved, pending, rounds, text, submit };
}

export function SaveBar({
  pending,
  saved,
  error,
  rounds,
  label = "Save ✓",
}: {
  pending: boolean;
  saved: string | null;
  error?: string;
  rounds: number;
  label?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 rounded-2xl bg-cream/95 px-1 py-3 backdrop-blur" data-save-rounds={rounds}>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : label}
      </Button>
      {saved && (
        <span role="status" className="font-bold text-mint-dark">
          {saved}
        </span>
      )}
      {error && (
        <span role="alert" tabIndex={-1} data-form-error className="font-bold text-bubblegum-dark">
          {error}
        </span>
      )}
    </div>
  );
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-5 shrink-0 accent-bubblegum-dark"
      />
      <span>
        <span className="text-lg">{label}</span>
        {hint && <span className="block text-sm text-ink-soft">{hint}</span>}
      </span>
    </label>
  );
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "hi", label: "हिंदी (Hindi)" },
] as const;

// One text in English, with optional Tamil and Hindi versions underneath.
// Empty Tamil/Hindi boxes simply show the English text to those shoppers.
export function LanguageFields({
  id,
  label,
  hint,
  error,
  values,
  onChange,
  placeholder,
  multiline,
  maxLength,
  required,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  values: { en: string; ta: string; hi: string };
  onChange: (code: "en" | "ta" | "hi", value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength: number;
  required?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(values.ta || values.hi));
  return (
    <div className="flex flex-col gap-2">
      {LANGUAGES.filter((language) => language.code === "en" || open).map((language) => {
        const fieldId = language.code === "en" ? id : `${id}-${language.code}`;
        const props = {
          id: fieldId,
          value: values[language.code],
          lang: language.code,
          maxLength,
          placeholder: language.code === "en" ? placeholder : "Leave empty to show the English text",
          onChange: (event: { target: { value: string } }) => onChange(language.code, event.target.value),
          ...(language.code === "en" ? describedBy(id, { error, hint }) : {}),
        };
        return (
          <Field
            key={language.code}
            id={fieldId}
            label={language.code === "en" ? label : `${label} — ${language.label}`}
            hint={language.code === "en" ? hint : undefined}
            error={language.code === "en" ? error : undefined}
            required={language.code === "en" && required}
          >
            {multiline ? <Textarea {...props} rows={3} /> : <Input {...props} />}
          </Field>
        );
      })}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn("self-start text-sm font-bold text-sky-dark underline underline-offset-2")}
        aria-expanded={open}
      >
        {open ? "Hide Tamil and Hindi" : "🌏 Add Tamil and Hindi versions"}
      </button>
    </div>
  );
}

// Shows an error message under a custom control (like the picture upload).
export function ShopImageFieldSlot({ error, children }: { error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {children}
      {error && (
        <p role="alert" className="text-sm font-bold text-bubblegum-dark">
          {error}
        </p>
      )}
    </div>
  );
}
