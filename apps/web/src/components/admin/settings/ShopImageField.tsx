"use client";

import { useRef, useState } from "react";
import { PRODUCT_IMAGES_BUCKET, productImageUrl } from "@/lib/catalog";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/compressImage";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

// Shrinks a picture to at most `max` pixels and saves it as WebP (which keeps
// see-through backgrounds), or PNG where the browser can't make WebP.
async function shrink(file: File, max: number): Promise<{ blob: Blob; extension: "webp" | "png" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't process this picture.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, extension: "webp" };
  const png = await toBlob("image/png");
  if (!png) throw new Error("Your browser couldn't process this picture.");
  return { blob: png, extension: "png" };
}

// Upload box for the shop logo or the signature on invoices. Only uploads the
// picture; the settings form saves which picture to use.
export function ShopImageField({
  id,
  kind,
  path,
  onChange,
  max,
  help,
  previewClassName = "h-16",
}: {
  id: string;
  kind: "logo" | "signature";
  path: string;
  onChange: (path: string) => void;
  max: number;
  help: string;
  previewClassName?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setProblem("");
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setProblem("Please use a JPG, PNG or WebP picture.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setProblem("This picture is too big (over 15 MB).");
      return;
    }
    setBusy(true);
    try {
      const { blob, extension } = await shrink(file, max);
      const storagePath = `shop/${kind}-${crypto.randomUUID()}.${extension}`;
      const { error } = await createClient()
        .storage.from(PRODUCT_IMAGES_BUCKET)
        .upload(storagePath, blob, { contentType: blob.type, cacheControl: "31536000" });
      if (error) throw error;
      onChange(storagePath);
    } catch {
      setProblem("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {path ? (
          <span className="flex items-center justify-center rounded-2xl border-2 border-ink/10 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productImageUrl(path)} alt={`Current ${kind}`} className={`${previewClassName} w-auto max-w-48 object-contain`} data-shop-image={kind} />
          </span>
        ) : (
          <span className="rounded-2xl border-2 border-dashed border-ink/20 px-4 py-3 text-sm text-ink-soft">No picture yet</span>
        )}
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Uploading…" : path ? "Change picture" : "📷 Upload picture"}
        </Button>
        {path && !busy && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
        <input
          ref={input}
          id={id}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          aria-label={kind === "logo" ? "Choose a logo picture" : "Choose a signature picture"}
          onChange={(event) => {
            upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      <p className="text-sm text-ink-soft">{help}</p>
      {problem && (
        <p role="alert" className="text-sm font-bold text-bubblegum-dark">
          {problem}
        </p>
      )}
    </div>
  );
}
