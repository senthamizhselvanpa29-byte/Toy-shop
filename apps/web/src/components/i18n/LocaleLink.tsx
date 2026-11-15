"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { LinkPending } from "@/components/shop/NavigationProgress";
import { localePath } from "@/lib/locales";
import { useT } from "./I18nProvider";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

// A link inside the shop that keeps the shopper's language ("/toys" → "/ta/toys")
// and shows the loading bar at the top of the screen while its page loads.
export function LocaleLink({ href, children, ...props }: Props) {
  const { locale } = useT();
  return (
    <Link href={localePath(locale, href)} {...props}>
      {children}
      <LinkPending />
    </Link>
  );
}
