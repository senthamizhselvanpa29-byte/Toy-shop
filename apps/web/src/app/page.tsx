import Link from "next/link";
import { DEFAULT_CATEGORIES, formatPaise } from "@toyshop/shared";
import { buttonClasses, CategoryTile } from "@/components/ui";

// Temporary welcome page — the real storefront arrives in Milestone 6.
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
          <li key={category.slug}>
            <CategoryTile {...category} />
          </li>
        ))}
      </ul>

      <Link href="/style-guide" className={buttonClasses("primary", "lg")}>
        See the style guide 🎨
      </Link>
    </main>
  );
}
