"use client";

import { photoForWidth } from "./photoSizes";

// Tells next/image which copy of a photo to use for each screen size
// (see photoSizes.ts). Set as the image loader in next.config.ts.
export default function imageLoader({ src, width }: { src: string; width: number }): string {
  return photoForWidth(src, width);
}
