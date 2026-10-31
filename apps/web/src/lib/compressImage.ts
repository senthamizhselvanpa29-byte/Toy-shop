// Shrinks a photo in the browser before upload: max 1600px on the longest side,
// saved as WebP (or JPEG where WebP isn't supported). Phone photos of 5–10 MB
// usually end up around 150–400 KB.

const MAX_SIDE = 1600;
const QUALITY = 0.85;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function compressImage(
  file: File,
): Promise<{ blob: Blob; extension: "webp" | "jpg" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't process this photo.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await toBlob(canvas, "image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, extension: "webp" };

  const jpeg = await toBlob(canvas, "image/jpeg");
  if (!jpeg) throw new Error("Your browser couldn't process this photo.");
  return { blob: jpeg, extension: "jpg" };
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY),
  );
}
