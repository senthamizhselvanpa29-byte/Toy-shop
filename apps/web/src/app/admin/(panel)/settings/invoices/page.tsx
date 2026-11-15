import { InvoiceSettingsForm } from "@/components/admin/settings/InvoiceSettingsForm";
import { NeedsUpdate } from "@/components/admin/settings/NeedsUpdate";
import { gstModeOf, readShopSettings } from "@/lib/shopProfile";
import { createClient } from "@/lib/supabase/server";

export default async function InvoiceSettingsPage() {
  const supabase = await createClient();
  const [row, { data: preview }] = await Promise.all([readShopSettings(supabase), supabase.rpc("next_invoice_preview")]);
  return (
    <>
      <NeedsUpdate row={row} />
      <InvoiceSettingsForm
        nextPreview={typeof preview === "string" ? preview : null}
        initial={{
          legalName: row.legal_name ?? "",
          gstMode: gstModeOf(row),
          gstin: row.gstin ?? "",
          hsn: row.default_hsn ?? "9503",
          prefix: row.invoice_prefix ?? "INV",
          includeYear: row.invoice_fy ?? true,
          nextNumber: "",
          notes: row.invoice_notes ?? "",
          signaturePath: row.signature_path ?? "",
          signatoryName: row.signatory_name ?? "",
        }}
      />
    </>
  );
}
