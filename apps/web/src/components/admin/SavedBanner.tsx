const messages: Record<string, string> = {
  "1": "Saved! ✓",
  published: "Hooray! Your toy is live in the shop 🎉",
  copied: "Copy made! It's saved as a draft — change what you need and publish.",
  deleted: "Toy deleted.",
};

export function SavedBanner({ kind }: { kind?: string }) {
  const message = kind ? messages[kind] : undefined;
  if (!message) return null;
  return (
    <p
      role="status"
      className="rounded-2xl bg-mint/25 px-4 py-3 font-bold text-mint-dark"
    >
      {message}
    </p>
  );
}
