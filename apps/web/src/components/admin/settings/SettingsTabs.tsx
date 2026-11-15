"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/settings/shop", label: "Shop & contact", icon: "🏪" },
  { href: "/admin/settings/banner", label: "Banner & holiday", icon: "📣" },
  { href: "/admin/settings/invoices", label: "Invoices", icon: "🧾" },
  { href: "/admin/settings/pages", label: "Policy pages", icon: "📄" },
  { href: "/admin/settings", label: "Delivery & payments", icon: "🚚" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings sections">
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const active = tab.href === "/admin/settings" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="shrink-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 font-bold whitespace-nowrap",
                  active ? "bg-ink text-white" : "bg-white text-ink shadow-soft hover:bg-sunshine/40",
                )}
              >
                <span aria-hidden>{tab.icon}</span> {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
