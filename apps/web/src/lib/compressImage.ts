// Shrinks a photo in the browser before upload and makes the three copies the
// shop needs (see photoSizes.ts), saved as WebP (or JPEG where the browser
// can't make WebP). A 5–10 MB phone photo ends up around 150–400 KB for the
// large copy and 15–60 KB for the small ones.
import { PHOTO_SIZES, type PhotoSizeKey } from "./photoSizes";

const QUALITY: Record<PhotoSizeKey, number> = { l: 0.85, m: 0.82, s: 0.8 };

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type CompressedPhoto = {
  extension: "webp" | "jpg";
  copies: { key: PhotoSizeKey; blob: Blob }[];
};

export async function compressImage(file: Blob): Promise<CompressedPhoto> {
  const bitmap = await createImageBitmap(file);

  // Largest first; each smaller copy is drawn from the one before it, which
  // keeps small pictures sharp.
  let source: CanvasImageSource = bitmap;
  let width = bitmap.width;
  let height = bitmap.height;
  const canvases: { key: PhotoSizeKey; canvas: HTMLCanvasElement }[] = [];
  for (const { key, max } of PHOTO_SIZES) {
    const scale = Math.min(1, max / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser couldn't process this photo.");
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    canvases.push({ key, canvas });
    source = canvas;
    width = canvas.width;
    height = canvas.height;
  }
  bitmap.close();

  const large = await toBlob(canvases[0].canvas, "image/webp", QUALITY.l);
  const webp = large !== null && large.type === "image/webp";
  const type = webp ? "image/webp" : "image/jpeg";

  const copies: CompressedPhoto["copies"] = [];
  for (const { key, canvas } of canvases) {
    const blob = webp && key === "l" ? large : await toBlob(canvas, type, QUALITY[key]);
    if (!blob) throw new Error("Your browser couldn't process this photo.");
    copies.push({ key, blob });
  }
  return { extension: webp ? "webp" : "jpg", copies };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}
