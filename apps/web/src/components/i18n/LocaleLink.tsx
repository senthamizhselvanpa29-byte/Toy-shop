"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/locales";
import { useT } from "./I18nProvider";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

// A link inside the shop that keeps the shopper's language ("/toys" → "/ta/toys").
export function LocaleLink({ href, ...props }: Props) {
  const { locale } = useT();
  return <Link href={localePath(locale, href)} {...props} />;
}
