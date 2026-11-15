// Every photo the owner uploads is stored in three sizes, so a small card on a
// phone doesn't download a picture meant for a big screen:
//   …-l.webp  large  (up to 1600px, toy page on a computer)
//   …-m.webp  medium (up to 800px, toy page on a phone)
//   …-s.webp  small  (up to 400px, cards, cart and lists)
// The database remembers the large one; the others are found by name.
// Demo pictures and photos uploaded before this existed have a single size.
export const PHOTO_SIZES = [
  { key: "l", max: 1600 },
  { key: "m", max: 800 },
  { key: "s", max: 400 },
] as const;

export type PhotoSizeKey = (typeof PHOTO_SIZES)[number]["key"];

const LARGE_COPY = /-l\.(webp|jpg)$/;

export function hasPhotoSizes(pathOrUrl: string): boolean {
  return LARGE_COPY.test(pathOrUrl);
}

// All stored files that make up one photo.
export function photoFiles(storagePath: string): string[] {
  if (!hasPhotoSizes(storagePath)) return [storagePath];
  return PHOTO_SIZES.map(({ key }) => storagePath.replace(LARGE_COPY, `-${key}.$1`));
}

// The smallest copy that still looks sharp at `width` pixels.
export function photoForWidth(url: string, width: number): string {
  if (!hasPhotoSizes(url)) return url;
  const size = [...PHOTO_SIZES].reverse().find(({ max }) => width <= max) ?? PHOTO_SIZES[0];
  return url.replace(LARGE_COPY, `-${size.key}.$1`);
}
