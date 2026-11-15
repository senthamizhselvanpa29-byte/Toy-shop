import type { ReactNode } from "react";
import { SettingsTabs } from "@/components/admin/settings/SettingsTabs";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">⚙️ Shop settings</h1>
        <p className="text-ink-soft">Everything here is yours to change. Customers see the changes straight away.</p>
      </div>
      <SettingsTabs />
      {children}
    </div>
  );
}
