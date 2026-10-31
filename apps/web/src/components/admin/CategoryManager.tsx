"use client";

import { useState, useTransition } from "react";
import { CATEGORY_COLORS, type CategoryColor } from "@toyshop/shared";
import {
  deleteCategory,
  moveCategory,
  saveCategory,
} from "@/app/admin/(panel)/categories/actions";
import { Button, Card, CategoryTile, describedBy, Field, Input } from "@/components/ui";
import { bgColor } from "@/components/ui/colors";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/catalog";

const EMOJI_CHOICES = ["🚗", "🧩", "🧸", "🎨", "📚", "⚽", "🎮", "👶", "🦖", "🚂", "🪀", "🎲", "🛝", "🎵", "🏰", "🔬", "🪁", "🎁"];

type Draft = { name: string; icon: string; color: CategoryColor };

export function CategoryManager({
  categories,
  productCounts,
}: {
  categories: Category[];
  productCounts: Record<string, number>;
}) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {editingId === "new" ? (
        <CategoryEditor
          key="new"
          initial={{ name: "", icon: "🎁", color: "sunshine" }}
          title="New category"
          onDone={() => setEditingId(null)}
          categoryId={null}
        />
      ) : (
        <Button className="self-start" size="lg" onClick={() => setEditingId("new")}>
          ➕ Add a category
        </Button>
      )}

      <ul className="flex flex-col gap-3">
        {categories.map((category, index) =>
          editingId === category.id ? (
            <li key={category.id}>
              <CategoryEditor
                initial={{ name: category.name, icon: category.icon, color: category.color }}
                title={`Edit “${category.name}”`}
                onDone={() => setEditingId(null)}
                categoryId={category.id}
              />
            </li>
          ) : (
            <li key={category.id}>
              <Card className="flex flex-wrap items-center gap-3 p-3">
                <span
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl",
                    bgColor[category.color],
                  )}
                  aria-hidden
                >
                  {category.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-xl">{category.name}</p>
                  <p className="text-sm text-ink-soft">
                    {productCounts[category.id] ?? 0} toy(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Move ${category.name} up`}
                    disabled={pending || index === 0}
                    onClick={() => startTransition(() => moveCategory(category.id, "up"))}
                  >
                    ▲
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Move ${category.name} down`}
                    disabled={pending || index === categories.length - 1}
                    onClick={() => startTransition(() => moveCategory(category.id, "down"))}
                  >
                    ▼
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(category.id)}>
                    ✏️ Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      const count = productCounts[category.id] ?? 0;
                      const warning = count
                        ? `Delete “${category.name}”? Its ${count} toy(s) will stay in the shop without a category.`
                        : `Delete “${category.name}”?`;
                      if (window.confirm(warning)) {
                        startTransition(() => deleteCategory(category.id));
                      }
                    }}
                  >
                    🗑️
                  </Button>
                </div>
              </Card>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function CategoryEditor({
  initial,
  title,
  categoryId,
  onDone,
}: {
  initial: Draft;
  title: string;
  categoryId: string | null;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const nameId = categoryId ? `category-name-${categoryId}` : "category-name-new";

  return (
    <Card className="flex flex-col gap-5 border-sunshine-dark">
      <h2 className="text-2xl">{title}</h2>
      <form
        className="grid gap-5 md:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await saveCategory(categoryId, draft);
            if (result.errors) setErrors(result.errors);
            else onDone();
          });
        }}
      >
        <div className="flex flex-col gap-5">
          <Field id={nameId} label="Name" required error={errors.name}>
            <Input
              id={nameId}
              value={draft.name}
              maxLength={60}
              autoFocus
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              {...describedBy(nameId, { error: errors.name })}
            />
          </Field>

          <fieldset>
            <legend className="font-heading text-lg">Emoji</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Use ${emoji}`}
                  aria-pressed={draft.icon === emoji}
                  onClick={() => setDraft({ ...draft, icon: emoji })}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl border-2 text-2xl",
                    draft.icon === emoji ? "border-sunshine-dark bg-sunshine/40" : "border-transparent bg-ink/5 hover:bg-ink/10",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-heading text-lg">Colour</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  aria-pressed={draft.color === color}
                  onClick={() => setDraft({ ...draft, color })}
                  className={cn(
                    "size-11 rounded-full border-4",
                    bgColor[color],
                    draft.color === color ? "border-ink" : "border-white shadow-soft",
                  )}
                />
              ))}
            </div>
          </fieldset>

          {errors.form && (
            <p role="alert" className="font-bold text-bubblegum-dark">
              {errors.form}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save ✓"}
            </Button>
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </div>

        <div className="w-44">
          <p className="mb-2 text-sm text-ink-soft">Preview</p>
          <CategoryTile name={draft.name || "Name"} icon={draft.icon} color={draft.color} />
        </div>
      </form>
    </Card>
  );
}
