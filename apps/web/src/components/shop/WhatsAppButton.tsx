"use client";

import { useT } from "@/components/i18n/I18nProvider";
import { whatsappLink } from "@/lib/whatsapp";

// Round "chat" button in the corner of every shop page. The message includes
// the page the shopper is looking at, so the owner knows which toy they mean.
export function WhatsAppButton({ number, message }: { number: string; message: string }) {
  const { t } = useT();
  const text = message || t("whatsapp.message");
  return (
    <a
      href={whatsappLink(number, text)}
      target="_blank"
      rel="noopener"
      aria-label={t("whatsapp.label")}
      title={t("whatsapp.label")}
      onClick={(event) => {
        event.currentTarget.href = whatsappLink(number, `${text}\n${window.location.href}`);
      }}
      className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition hover:scale-110 focus-visible:outline-4 focus-visible:outline-sky-dark print:hidden"
      data-whatsapp
    >
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden fill="currentColor">
        <path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.2.6 4.4 1.7 6.3L3.2 29l7.3-1.9c1.8 1 3.9 1.5 5.9 1.5 7 0 12.7-5.6 12.7-12.6S23 3 16 3zm0 23.4c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.3 1.1 1.2-4.2-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.7C5.1 9.8 10 5.1 16 5.1s10.9 4.8 10.9 10.6S22 26.4 16 26.4zm6-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1c-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2s0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.8 5 .8.4 1.4.6 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z" />
      </svg>
    </a>
  );
}
