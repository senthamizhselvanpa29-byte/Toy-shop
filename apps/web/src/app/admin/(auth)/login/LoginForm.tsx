"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { signIn, type SignInState } from "../../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field id="email" label="Email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
        />
      </Field>
      <Field id="password" label="Password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      {state.error && (
        <p
          role="alert"
          className="rounded-2xl bg-bubblegum/15 px-4 py-3 font-bold text-bubblegum-dark"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Logging in…" : "Log in 🚀"}
      </Button>
    </form>
  );
}
