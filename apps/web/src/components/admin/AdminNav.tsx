"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = { label: string; icon: string; href?: string };

// Items without an href are coming in later milestones.
const items: NavItem[] = [
  { label: "Dashboard", icon: "🏠", href: "/admin" },
  { label: "Products", icon: "🧸", href: "/admin/products" },
  { label: "Categories", icon: "🗂️", href: "/admin/categories" },
  { label: "Orders", icon: "📦" },
  { label: "Customers", icon: "👨‍👩‍👧" },
  { label: "Coupons", icon: "🎟️" },
  { label: "Settings", icon: "⚙️" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Owner menu">
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : Boolean(item.href && pathname.startsWith(item.href));
          const content = (
            <>
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
              {!item.href && (
                <span className="ml-auto rounded-full bg-ink/10 px-2 text-xs">
                  Soon
                </span>
              )}
            </>
          );
          const base =
            "flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 font-heading text-lg";

          return (
            <li key={item.label} className="shrink-0">
              {item.href ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    base,
                    active ? "bg-sunshine shadow-soft" : "hover:bg-ink/5",
                  )}
                >
                  {content}
                </Link>
              ) : (
                <span className={cn(base, "cursor-not-allowed text-ink-soft/70")}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
