import { en, type MessageKey } from "./en";
import { hi } from "./hi";
import type { Locale } from "./index";
import { ta } from "./ta";

// Every language's words (about 80 KB). For server code: a page sends the
// browser only the one list it needs, so never import this in a
// "use client" file.
export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ta, hi };
