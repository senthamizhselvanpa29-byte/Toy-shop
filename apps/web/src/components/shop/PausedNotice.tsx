import type { Translator } from "@/lib/i18n";

// Shown on every shop page while the owner has paused new orders.
export function PausedNotice({ message, t }: { message: string; t: Translator }) {
  return (
    <div role="status" className="bg-ink px-4 py-2.5 text-center text-sm text-white" data-paused-notice>
      <strong>⏸️ {t("paused.title")}.</strong> {message || t("paused.default")}
    </div>
  );
}
