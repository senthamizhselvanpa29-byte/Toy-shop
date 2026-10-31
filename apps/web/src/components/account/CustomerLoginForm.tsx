"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatIndianMobile, normalizeIndianMobile } from "@toyshop/shared";
import { Button, describedBy, Field, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { loginMethods } from "@/lib/loginMethods";
import { createClient } from "@/lib/supabase/client";

type Method = "phone" | "email";

const RESEND_SECONDS = 60;

function friendlyError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("rate") || text.includes("seconds") || text.includes("too many")) {
    return "Please wait a minute before asking for another code.";
  }
  if (text.includes("expired") || text.includes("invalid") || text.includes("token")) {
    return "That code didn't work. Check it, or ask for a new one.";
  }
  if (text.includes("sms") || text.includes("phone provider")) {
    return "We couldn't send an SMS right now. Please try email instead.";
  }
  return "Something went wrong. Please try again.";
}

export function CustomerLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>(loginMethods.phone ? "phone" : "email");
  const [step, setStep] = useState<"enter" | "code">("enter");
  const [identifier, setIdentifier] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    setError("");
    let target = identifier.trim();
    if (method === "phone") {
      const phone = normalizeIndianMobile(target);
      if (!phone) return setError("Enter a 10-digit Indian mobile number");
      target = phone;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      return setError("Enter a valid email address");
    }

    setBusy(true);
    const supabase = createClient();
    const { error: sendError } =
      method === "phone"
        ? await supabase.auth.signInWithOtp({ phone: target })
        : await supabase.auth.signInWithOtp({ email: target.toLowerCase(), options: { shouldCreateUser: true } });
    setBusy(false);

    if (sendError) return setError(friendlyError(sendError.message));
    setSentTo(method === "email" ? target.toLowerCase() : target);
    setStep("code");
    setCode("");
    setCooldown(RESEND_SECONDS);
  }

  async function verifyCode() {
    setError("");
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return setError("Enter the code we sent you");
    setBusy(true);
    const supabase = createClient();
    const { error: verifyError } =
      method === "phone"
        ? await supabase.auth.verifyOtp({ phone: sentTo, token, type: "sms" })
        : await supabase.auth.verifyOtp({ email: sentTo, token, type: "email" });
    if (verifyError) {
      setBusy(false);
      return setError(friendlyError(verifyError.message));
    }
    router.replace(next);
    router.refresh();
  }

  async function continueWithGoogle() {
    setError("");
    setBusy(true);
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account/callback?next=${encodeURIComponent(next)}` },
    });
    if (oauthError) {
      setBusy(false);
      setError(friendlyError(oauthError.message));
    }
  }

  if (step === "code") {
    return (
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          verifyCode();
        }}
      >
        <p className="text-ink-soft">
          We sent a code to{" "}
          <strong className="text-ink">{method === "phone" ? formatIndianMobile(sentTo) : sentTo}</strong>.
          {method === "email" && " Check your inbox (and spam folder)."}
        </p>
        <Field id="otp-code" label="Enter the code" error={error}>
          <Input
            id="otp-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            autoFocus
            placeholder="123456"
            className="text-center font-heading text-2xl tracking-[0.4em]"
            {...describedBy("otp-code", { error })}
          />
        </Field>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Checking…" : "Log in 🚀"}
        </Button>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <button
            type="button"
            className="font-bold text-sky-dark underline-offset-2 hover:underline"
            onClick={() => {
              setStep("enter");
              setError("");
            }}
          >
            ← Change {method === "phone" ? "number" : "email"}
          </button>
          <button
            type="button"
            disabled={cooldown > 0 || busy}
            className="font-bold text-sky-dark underline-offset-2 enabled:hover:underline disabled:text-ink-soft"
            onClick={sendCode}
          >
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {loginMethods.phone && (
        <div role="tablist" aria-label="Log in with" className="grid grid-cols-2 gap-1 rounded-full bg-ink/5 p-1">
          {(["phone", "email"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={method === item}
              onClick={() => {
                setMethod(item);
                setIdentifier("");
                setError("");
              }}
              className={cn(
                "rounded-full py-2 font-heading transition",
                method === item ? "bg-white shadow-soft" : "text-ink-soft",
              )}
            >
              {item === "phone" ? "📱 Mobile" : "✉️ Email"}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          sendCode();
        }}
      >
        {method === "phone" ? (
          <Field id="login-phone" label="Mobile number" error={error} hint="We'll send a 6-digit code by SMS">
            <div className="flex">
              <span className="flex items-center rounded-l-2xl border-2 border-r-0 border-ink/15 bg-ink/5 px-3 font-bold">
                +91
              </span>
              <Input
                id="login-phone"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98765 43210"
                className="rounded-l-none"
                autoFocus
                {...describedBy("login-phone", { error, hint: "yes" })}
              />
            </div>
          </Field>
        ) : (
          <Field id="login-email" label="Email address" error={error} hint="We'll email you a 6-digit code — no password needed">
            <Input
              id="login-email"
              type="email"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              autoFocus
              {...describedBy("login-email", { error, hint: "yes" })}
            />
          </Field>
        )}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Sending…" : "Send code ✨"}
        </Button>
      </form>

      {loginMethods.google && (
        <>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <span className="h-px flex-1 bg-ink/15" /> or <span className="h-px flex-1 bg-ink/15" />
          </div>
          <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={continueWithGoogle} className="border-2 border-ink/15 bg-white">
            <span className="font-bold text-sky-dark" aria-hidden>G</span> Continue with Google
          </Button>
        </>
      )}
    </div>
  );
}
