"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui";

export function SortSelect({ options }: { options: readonly { id: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm font-bold">
      <span className="shrink-0">Sort by</span>
      <Select
        value={params.get("sort") ?? "new"}
        onChange={(event) => {
          const next = new URLSearchParams(params);
          if (event.target.value === "new") next.delete("sort");
          else next.set("sort", event.target.value);
          next.delete("page");
          const query = next.toString();
          router.push(query ? `${pathname}?${query}` : pathname);
        }}
        className="w-auto py-1.5 text-sm"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
