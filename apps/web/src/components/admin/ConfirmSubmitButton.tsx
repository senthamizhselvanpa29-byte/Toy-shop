"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui";

// A submit button that asks "Are you sure?" first.
export function ConfirmSubmitButton({
  message,
  ...props
}: ComponentProps<typeof Button> & { message: string }) {
  return (
    <Button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      {...props}
    />
  );
}
