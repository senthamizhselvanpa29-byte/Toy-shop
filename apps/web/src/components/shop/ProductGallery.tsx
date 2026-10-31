"use client";

import Image from "next/image";
import { useState } from "react";
import { bgColor, type ThemeColor } from "@/components/ui/colors";
import { cn } from "@/lib/cn";

export function ProductGallery({
  images,
  name,
  placeholderIcon,
  placeholderColor,
}: {
  images: { url: string; alt: string }[];
  name: string;
  placeholderIcon: string;
  placeholderColor: ThemeColor;
}) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden rounded-bubble shadow-soft",
          bgColor[placeholderColor],
        )}
      >
        {current ? (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="text-[10rem]" aria-hidden>
            {placeholderIcon}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="More photos">
          {images.map((image, i) => (
            <li key={image.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative block size-20 overflow-hidden rounded-2xl border-3 transition",
                  i === index ? "border-sunshine-dark" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
