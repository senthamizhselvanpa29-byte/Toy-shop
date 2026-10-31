import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const controlClasses =
  "w-full rounded-2xl border-2 border-ink/15 bg-white px-4 py-2.5 text-base text-ink placeholder:text-ink-soft/60 transition focus:border-sky-dark focus:outline-none focus:ring-4 focus:ring-sky/30 aria-invalid:border-bubblegum-dark aria-invalid:ring-bubblegum/20 disabled:bg-ink/5";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

// Wraps a form control with its label, hint text and error message.
export function Field({ id, label, hint, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-heading text-lg text-ink">
        {label}
        {required && (
          <span className="text-bubblegum-dark" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-bold text-bubblegum-dark">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-ink-soft">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

// Props that link a control to its Field's hint or error text.
export function describedBy(id: string, { error, hint }: { error?: string; hint?: string }) {
  if (error) return { "aria-invalid": true, "aria-describedby": `${id}-error` } as const;
  if (hint) return { "aria-describedby": `${id}-hint` } as const;
  return {};
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(controlClasses, "min-h-28", className)} {...props} />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClasses, "pr-10", className)} {...props} />;
}
