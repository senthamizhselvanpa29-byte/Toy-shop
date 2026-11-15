"use client";

import { useEffect } from "react";
import { Button, TobySays } from "@/components/ui";

// Last-resort page when something fails outside the shop's own error page
// (for example while loading the header).
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <TobySays
        title="Oops! Something went wrong"
        action={
          <Button type="button" size="lg" onClick={reset}>
            Try again 🔄
          </Button>
        }
      >
        Toby tripped over a toy. Please try again in a moment.
      </TobySays>
    </main>
  );
}
