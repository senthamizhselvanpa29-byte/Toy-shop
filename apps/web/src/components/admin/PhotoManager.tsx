"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { MAX_PRODUCT_IMAGES } from "@toyshop/shared";
import { cn } from "@/lib/cn";
import { isDemoImagePath, PRODUCT_IMAGES_BUCKET, productImageUrl } from "@/lib/catalog";
import { ACCEPTED_IMAGE_TYPES, compressImage } from "@/lib/compressImage";
import { hasPhotoSizes } from "@/lib/photoSizes";
import { createClient } from "@/lib/supabase/client";

type Storage = ReturnType<typeof createClient>;

// Makes the three copies of a photo and uploads them. Returns the stored path
// of the large copy, which is what the toy remembers.
async function uploadPhoto(supabase: Storage, folderId: string, source: Blob): Promise<string> {
  const { extension, copies } = await compressImage(source);
  const base = `products/${folderId}/${crypto.randomUUID()}`;
  const bucket = supabase.storage.from(PRODUCT_IMAGES_BUCKET);
  const paths = copies.map(({ key }) => `${base}-${key}.${extension}`);
  const results = await Promise.all(
    copies.map(({ blob }, index) =>
      bucket.upload(paths[index], blob, {
        contentType: blob.type,
        // File names are never reused, so browsers may keep photos for a year.
        cacheControl: "31536000",
      }),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    // Don't leave half a photo behind.
    await bucket.remove(paths).catch(() => {});
    throw failed.error;
  }
  return `${base}-l.${extension}`;
}

export type PhotoItem = { storagePath: string; altText: string };

const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

type PhotoManagerProps = {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  // Folder in storage for this toy's photos.
  folderId: string;
  onUploadingChange?: (uploading: boolean) => void;
  error?: string;
};

export function PhotoManager({
  photos,
  onChange,
  folderId,
  onUploadingChange,
  error,
}: PhotoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [problems, setProblems] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [speedingUp, setSpeedingUp] = useState(false);
  // Latest list, so uploads that finish one by one don't overwrite each other.
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const spaceLeft = MAX_PRODUCT_IMAGES - photos.length - uploading;

  async function addFiles(files: File[]) {
    setProblems([]);
    const errors: string[] = [];
    const accepted = files.filter((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: please use a JPG, PNG or WebP photo.`);
        return false;
      }
      if (file.size > MAX_ORIGINAL_BYTES) {
        errors.push(`${file.name}: this photo is too big (over 25 MB).`);
        return false;
      }
      return true;
    });
    if (accepted.length > spaceLeft) {
      errors.push(`You can add ${Math.max(spaceLeft, 0)} more photo(s) — up to ${MAX_PRODUCT_IMAGES} per toy.`);
      accepted.splice(Math.max(spaceLeft, 0));
    }
    if (accepted.length === 0) {
      setProblems(errors);
      return;
    }

    setUploading((count) => count + accepted.length);
    onUploadingChange?.(true);
    const supabase = createClient();

    await Promise.all(
      accepted.map(async (file) => {
        try {
          const path = await uploadPhoto(supabase, folderId, file);
          onChange([...photosRef.current, { storagePath: path, altText: "" }]);
        } catch {
          errors.push(`${file.name}: upload failed. Please try again.`);
        } finally {
          setUploading((count) => count - 1);
        }
      }),
    );

    onUploadingChange?.(false);
    setProblems(errors);
  }

  // Photos added before the shop made small copies (one big file each).
  const slowPhotos = photos.filter(
    (photo) => !hasPhotoSizes(photo.storagePath) && !isDemoImagePath(photo.storagePath),
  );

  async function speedUpPhotos() {
    setProblems([]);
    setSpeedingUp(true);
    onUploadingChange?.(true);
    const supabase = createClient();
    const errors: string[] = [];
    for (const photo of slowPhotos) {
      try {
        const response = await fetch(productImageUrl(photo.storagePath));
        if (!response.ok) throw new Error("download failed");
        const path = await uploadPhoto(supabase, folderId, await response.blob());
        onChange(
          photosRef.current.map((item) =>
            item.storagePath === photo.storagePath ? { ...item, storagePath: path } : item,
          ),
        );
      } catch {
        errors.push("One photo couldn't be converted. Please remove it and add it again.");
      }
    }
    setSpeedingUp(false);
    onUploadingChange?.(false);
    setProblems(errors);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    if (dragIndex !== null) return;
    addFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <div className="flex flex-col gap-4">
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li
              key={photo.storagePath}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 bg-white",
                index === 0 ? "border-sunshine-dark" : "border-ink/10",
                dragIndex === index && "opacity-50",
              )}
            >
              <div className="relative aspect-square cursor-grab">
                <Image
                  src={productImageUrl(photo.storagePath)}
                  alt={`Photo ${index + 1}`}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
              {index === 0 && (
                <span className="absolute top-2 left-2 rounded-full bg-sunshine px-2 py-0.5 text-xs font-bold">
                  ⭐ Cover
                </span>
              )}
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex gap-1">
                  <IconButton label="Move left" onClick={() => move(index, index - 1)} disabled={index === 0}>
                    ◀
                  </IconButton>
                  <IconButton
                    label="Move right"
                    onClick={() => move(index, index + 1)}
                    disabled={index === photos.length - 1}
                  >
                    ▶
                  </IconButton>
                  {index !== 0 && (
                    <IconButton label="Make cover photo" onClick={() => move(index, 0)}>
                      ⭐
                    </IconButton>
                  )}
                </div>
                <IconButton
                  label="Remove photo"
                  onClick={() => onChange(photos.filter((_, i) => i !== index))}
                >
                  🗑️
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {slowPhotos.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-sunshine/25 px-4 py-3">
          <p className="min-w-48 flex-1 text-sm">
            ⚡ {slowPhotos.length === 1 ? "One photo is" : `${slowPhotos.length} photos are`} in the old, slower
            format. Speed {slowPhotos.length === 1 ? "it" : "them"} up, then save the toy.
          </p>
          <button
            type="button"
            onClick={speedUpPhotos}
            disabled={speedingUp || uploading > 0}
            className="rounded-full bg-sunshine px-4 py-2 text-sm font-bold shadow-soft hover:bg-sunshine-dark disabled:opacity-60"
          >
            {speedingUp ? "Working…" : "⚡ Speed up photos"}
          </button>
        </div>
      )}

      {spaceLeft > 0 && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (dragIndex === null) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center gap-2 rounded-bubble border-3 border-dashed px-4 py-8 text-center transition",
            dragOver ? "border-sky-dark bg-sky/15" : "border-ink/20 bg-white",
          )}
        >
          <span className="text-4xl" aria-hidden>
            📸
          </span>
          <p className="font-heading text-lg">
            {uploading > 0
              ? `Uploading ${uploading} photo${uploading > 1 ? "s" : ""}…`
              : "Drop photos here"}
          </p>
          <p className="text-sm text-ink-soft">
            or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-bold text-sky-dark underline underline-offset-2"
            >
              choose from your device
            </button>{" "}
            · JPG, PNG or WebP · up to {MAX_PRODUCT_IMAGES} photos
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            className="sr-only"
            aria-label="Choose photos"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </div>
      )}

      {photos.length > 1 && (
        <p className="text-sm text-ink-soft">
          Tip: drag photos or use ◀ ▶ to change the order. The first photo is the cover.
        </p>
      )}

      {[...problems, ...(error ? [error] : [])].map((problem) => (
        <p key={problem} role="alert" className="text-sm font-bold text-bubblegum-dark">
          {problem}
        </p>
      ))}
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-full text-sm hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-sky-dark disabled:opacity-30"
    >
      {children}
    </button>
  );
}
