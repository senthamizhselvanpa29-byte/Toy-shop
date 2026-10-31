import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer.status === "owner") redirect("/admin");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <div className="text-6xl" aria-hidden>
          🧸🔑
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl">Shop owner login</h1>
        <p className="mt-1 text-ink-soft">Welcome back! Let&apos;s run the shop.</p>
      </div>
      <Card>
        <LoginForm />
      </Card>
    </main>
  );
}
