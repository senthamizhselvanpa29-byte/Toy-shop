import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AGE_GROUPS, DEFAULT_CATEGORIES } from "@toyshop/shared";
import {
  AgeBadge,
  Badge,
  Button,
  Card,
  CategoryTile,
  describedBy,
  Field,
  Input,
  PriceTag,
  ProductCard,
  Select,
  Textarea,
  TobyLoader,
  TobySays,
  type ProductCardData,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Style guide · Toy Shop",
  robots: { index: false },
};

const swatches = [
  { name: "Sunshine", className: "bg-sunshine", hex: "#FFC93C" },
  { name: "Sky", className: "bg-sky", hex: "#4FC3F7" },
  { name: "Bubblegum", className: "bg-bubblegum", hex: "#FF7EB6" },
  { name: "Mint", className: "bg-mint", hex: "#5EDCA6" },
  { name: "Orange", className: "bg-orange", hex: "#FF9F43" },
  { name: "Grape", className: "bg-grape", hex: "#9B7BFF" },
  { name: "Ink (text)", className: "bg-ink", hex: "#2B2A4C" },
  { name: "Cream (background)", className: "bg-cream", hex: "#FFF9EE" },
];

const sampleProducts: ProductCardData[] = [
  {
    name: "Rainbow Wooden Stacking Rings",
    categoryName: "Baby",
    ageGroup: "0-2",
    pricePaise: 49900,
    mrpPaise: 79900,
    stock: 12,
    placeholderIcon: "🌈",
    placeholderColor: "bubblegum",
    isNew: true,
  },
  {
    name: "Remote Control Monster Truck",
    categoryName: "Vehicles",
    ageGroup: "6-8",
    pricePaise: 129900,
    mrpPaise: 189900,
    stock: 3,
    placeholderIcon: "🚙",
    placeholderColor: "sky",
  },
  {
    name: "100-Piece Jungle Animals Jigsaw Puzzle",
    categoryName: "Puzzles",
    ageGroup: "3-5",
    pricePaise: 34900,
    stock: 25,
    placeholderIcon: "🦁",
    placeholderColor: "grape",
  },
  {
    name: "Junior Science Lab Kit",
    categoryName: "Learning",
    ageGroup: "9-12",
    pricePaise: 89900,
    mrpPaise: 99900,
    stock: 0,
    placeholderIcon: "🔬",
    placeholderColor: "mint",
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-12">
      <header className="flex flex-col gap-2">
        <Badge color="grape" className="self-start">
          For the shop team
        </Badge>
        <h1 className="text-4xl sm:text-5xl">🎨 Toy Shop style guide</h1>
        <p className="max-w-2xl text-lg text-ink-soft">
          Every building block used across the shop, in one place. If it looks
          right here, it will look right everywhere.
        </p>
      </header>

      <Section title="Colours">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {swatches.map((swatch) => (
            <li key={swatch.name} className="flex flex-col gap-2">
              <div
                className={`${swatch.className} h-20 rounded-bubble border-2 border-ink/10 shadow-soft`}
              />
              <div>
                <p className="font-heading">{swatch.name}</p>
                <p className="text-sm text-ink-soft">{swatch.hex}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Text">
        <Card className="flex flex-col gap-3">
          <p className="font-heading text-5xl">Big heading</p>
          <p className="font-heading text-3xl">Section heading</p>
          <p className="font-heading text-xl">Small heading</p>
          <p className="text-lg">
            Body text is easy to read for parents — clear, friendly and roomy.
          </p>
          <p className="text-sm text-ink-soft">Small helper text</p>
        </Card>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Add to cart 🛒</Button>
          <Button variant="secondary">View details</Button>
          <Button variant="success">Save product ✓</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="ghost">Cancel</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-3">
          <Badge color="ink">New</Badge>
          <Badge color="bubblegum">Best seller</Badge>
          <Badge color="mint">In stock</Badge>
          <Badge color="orange">Few left</Badge>
          <Badge color="sky">Free delivery</Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          {AGE_GROUPS.map((group) => (
            <AgeBadge key={group.id} age={group.id} />
          ))}
        </div>
      </Section>

      <Section title="Prices">
        <Card className="flex flex-col gap-4">
          <PriceTag pricePaise={49900} mrpPaise={79900} size="lg" />
          <PriceTag pricePaise={129900} mrpPaise={189900} />
          <PriceTag pricePaise={34900} />
        </Card>
      </Section>

      <Section title="Product cards">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {sampleProducts.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </Section>

      <Section title="Categories">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {DEFAULT_CATEGORIES.map((category) => (
            <li key={category.slug}>
              <CategoryTile {...category} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Form fields">
        <Card className="grid gap-6 sm:grid-cols-2">
          <Field id="sg-name" label="Toy name" required hint="What do kids call it?">
            <Input
              id="sg-name"
              placeholder="e.g. Rainbow Stacking Rings"
              {...describedBy("sg-name", { hint: "What do kids call it?" })}
            />
          </Field>
          <Field id="sg-price" label="Price (₹)" required error="Oops! Please add a price 🙂">
            <Input
              id="sg-price"
              inputMode="decimal"
              placeholder="499"
              {...describedBy("sg-price", { error: "Oops! Please add a price 🙂" })}
            />
          </Field>
          <Field id="sg-age" label="Age group">
            <Select id="sg-age" defaultValue="3-5">
              {AGE_GROUPS.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="sg-category" label="Category">
            <Select id="sg-category" defaultValue="">
              <option value="" disabled>
                Pick a category
              </option>
              {DEFAULT_CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.icon} {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field id="sg-description" label="Description">
              <Textarea
                id="sg-description"
                placeholder="Tell parents what makes this toy special…"
              />
            </Field>
          </div>
        </Card>
      </Section>

      <Section title="Toby the Teddy">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <TobySays
              title="No toys yet!"
              action={<Button>Add your first toy 🚀</Button>}
            >
              Let&apos;s fill this shelf with something fun.
            </TobySays>
          </Card>
          <Card className="flex items-center justify-center">
            <TobyLoader label="Finding toys…" />
          </Card>
        </div>
      </Section>
    </main>
  );
}
