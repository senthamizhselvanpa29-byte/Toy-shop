"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/(shop)/account/actions";
import { Button, describedBy, Field, Input } from "@/components/ui";

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [values, setValues] = useState({ fullName, phone });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        startTransition(async () => {
          const result = await updateProfile(values);
          setErrors(result.errors ?? {});
          setSaved(Boolean(result.ok));
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="profile-name" label="Your name" error={errors.fullName}>
          <Input
            id="profile-name"
            value={values.fullName}
            maxLength={80}
            autoComplete="name"
            onChange={(event) => setValues({ ...values, fullName: event.target.value })}
            {...describedBy("profile-name", { error: errors.fullName })}
          />
        </Field>
        <Field id="profile-phone" label="Mobile number" error={errors.phone}>
          <Input
            id="profile-phone"
            value={values.phone}
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            onChange={(event) => setValues({ ...values, phone: event.target.value })}
            {...describedBy("profile-phone", { error: errors.phone })}
          />
        </Field>
      </div>
      {errors.form && <p role="alert" className="font-bold text-bubblegum-dark">{errors.form}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
        {saved && <span role="status" className="font-bold text-mint-dark">Saved ✓</span>}
      </div>
    </form>
  );
}
