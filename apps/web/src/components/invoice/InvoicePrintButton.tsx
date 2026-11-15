"use client";

import { Button } from "@/components/ui";

// Opens the browser's print window. Choosing "Save as PDF" there downloads the
// invoice; the file is named after the invoice number (e.g. INV-26-27-0001.pdf).
export function InvoicePrintButton({ fileName }: { fileName: string }) {
  return (
    <div className="flex gap-2 print:hidden">
      <Button
        onClick={() => {
          const title = document.title;
          document.title = fileName;
          window.print();
          // Some browsers read the title after print() returns.
          setTimeout(() => {
            document.title = title;
          }, 1000);
        }}
      >
        ⬇️ Download PDF / 🖨️ Print
      </Button>
    </div>
  );
}
