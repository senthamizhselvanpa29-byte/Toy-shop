import { DEFAULT_CATEGORIES, formatPaise } from "@toyshop/shared";

// Temporary welcome page for Milestone 1 — shows the theme is wired up.
// The real storefront arrives in Milestone 6.
const swatchClasses: Record<string, string> = {
  sky: "bg-sky",
  grape: "bg-grape",
  bubblegum: "bg-bubblegum",
  orange: "bg-orange",
  mint: "bg-mint",
  sunshine: "bg-sunshine",
};

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-16 text-center">
      <div className="text-7xl" aria-hidden>
        🧸
      </div>
      <h1 className="text-4xl font-semibold sm:text-6xl">
        Welcome to the <span className="text-bubblegum-dark">Toy Shop!</span>
      </h1>
      <p className="max-w-xl text-lg text-ink-soft">
        Hi, I&apos;m Toby the Teddy. Our shop is being built — toys starting
        from {formatPaise(9900)} are on their way!
      </p>

      <ul className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {DEFAULT_CATEGORIES.map((category) => (
          <li
            key={category.slug}
            className={`${swatchClasses[category.color]} rounded-bubble shadow-soft flex flex-col items-center gap-2 px-4 py-6 font-heading text-lg text-ink transition-transform hover:-translate-y-1`}
          >
            <span className="text-4xl" aria-hidden>
              {category.icon}
            </span>
            {category.name}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="rounded-full bg-sunshine px-8 py-3 font-heading text-xl text-ink shadow-soft hover:animate-wiggle"
      >
        Coming soon 🎉
      </button>
    </main>
  );
}
