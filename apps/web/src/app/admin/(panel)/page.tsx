import { Card } from "@/components/ui";
import { getViewer } from "@/lib/auth";

const steps = [
  { done: true, label: "Log in to your owner area" },
  { done: false, label: "Set up your toy categories", when: "Milestone 4" },
  { done: false, label: "Add your first toy with photos", when: "Milestone 4" },
  { done: false, label: "Take your first order", when: "Milestone 9" },
];

export default async function AdminDashboard() {
  const viewer = await getViewer();
  const name =
    viewer.status === "owner" && viewer.fullName ? viewer.fullName : "Shop Owner";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">Hello, {name}! 👋</h1>
        <p className="mt-1 text-lg text-ink-soft">
          This is your shop&apos;s control room. Only you can see it.
        </p>
      </div>

      <Card>
        <h2 className="text-2xl">Getting started</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3 text-lg">
              <span
                className={
                  step.done
                    ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-mint"
                    : "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-ink/20"
                }
                aria-hidden
              >
                {step.done ? "✓" : ""}
              </span>
              <span className={step.done ? "line-through text-ink-soft" : ""}>
                {step.label}
              </span>
              {step.when && (
                <span className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-ink/5 px-3 py-0.5 text-sm text-ink-soft">
                  {step.when}
                </span>
              )}
              <span className="sr-only">{step.done ? "(done)" : "(to do)"}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
