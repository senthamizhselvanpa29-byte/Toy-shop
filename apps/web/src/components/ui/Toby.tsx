import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TobySaysProps = {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

// Toby the Teddy, the shop mascot, for empty states and friendly messages.
export function TobySays({ title, children, action, className }: TobySaysProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 px-4 py-10 text-center",
        className,
      )}
    >
      <div className="text-6xl motion-safe:animate-bounce" aria-hidden>
        🧸
      </div>
      <div className="relative max-w-md rounded-bubble bg-white px-6 py-4 shadow-soft">
        <span
          className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 bg-white"
          aria-hidden
        />
        <p className="font-heading text-xl text-ink">{title}</p>
        {children && <div className="mt-1 text-ink-soft">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function TobyLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-ink-soft">
      <span className="text-3xl motion-safe:animate-spin" aria-hidden>
        🧸
      </span>
      <span className="font-heading">{label}</span>
    </div>
  );
}
