"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { bgColor, type ThemeColor } from "@/components/ui/colors";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "toyshop-closed-announcement";

// The owner's message at the top of every shop page ("Diwali sale — 20% off!").
// A shopper can close it; it stays closed until the owner writes a new message.
export function AnnouncementBar({ text, link, color }: { text: string; link: string; color: ThemeColor }) {
  const { t } = useT();
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === text) setClosed(true);
    } catch {
      // Storage can be blocked (private browsing); the bar then simply stays.
    }
  }, [text]);

  if (closed) return null;

  const external = /^https?:\/\//i.test(link);
  const content = <span className="font-bold">{text}</span>;
  return (
    <div className={cn("relative px-10 py-2 text-center text-sm text-ink", bgColor[color])} data-announcement>
      {link ? (
        external ? (
          <a href={link} className="underline-offset-2 hover:underline" rel="noopener">
            {content} <span aria-hidden>→</span>
          </a>
        ) : (
          <LocaleLink href={link} className="underline-offset-2 hover:underline">
            {content} <span aria-hidden>→</span>
          </LocaleLink>
        )
      ) : (
        content
      )}
      <button
        type="button"
        aria-label={t("announcement.close")}
        onClick={() => {
          setClosed(true);
          try {
            window.localStorage.setItem(STORAGE_KEY, text);
          } catch {}
        }}
        className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-ink"
      >
        ✕
      </button>
    </div>
  );
}
