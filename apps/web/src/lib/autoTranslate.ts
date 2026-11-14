// "✨ Auto-translate" for the owner: turns a toy's English words into Tamil
// and Hindi with Claude. Server-only — it needs ANTHROPIC_API_KEY, which is
// set in Vercel and never sent to the browser. Without the key the button
// simply doesn't show and the owner types the words in by hand.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { ProductTexts, ProductTranslations } from "@toyshop/shared";

export function isAutoTranslateConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const TextsSchema = z.object({
  name: z.string(),
  shortDescription: z.string(),
  description: z.string(),
});
const TranslationSchema = z.object({ ta: TextsSchema, hi: TextsSchema });

const SYSTEM_PROMPT = `You translate the words of a children's toy shop in India from English into Tamil (ta) and Hindi (hi). Shoppers are parents and grandparents buying toys online, so the result will be shown on the shop's website as it is.

Write warm, simple, everyday Tamil and Hindi, the way a friendly local shopkeeper would describe a toy, rather than formal or literary language. Translate the meaning, not word by word, and keep each translation about as long as the English. Keep brand names, model numbers, sizes, measurements, numbers and emojis exactly as they are. Everyday shopping words that Indian families normally say in English (such as USB, LED, kit, puzzle or remote control) can stay in English, written in the Tamil or Hindi script, when that reads more naturally.

The fields are a product name, a one-line summary and a full description. If an English field is empty, return an empty string for that field.`;

const LIMITS = { name: 120, shortDescription: 200, description: 5000 } as const;

export class AutoTranslateError extends Error {}

export async function translateToTamilAndHindi(texts: ProductTexts): Promise<ProductTranslations> {
  const client = new Anthropic();

  let response;
  try {
    response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // If the model ever declines, the API retries on a fallback model by itself.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(TranslationSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            name: texts.name,
            shortDescription: texts.shortDescription,
            description: texts.description,
          }),
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      throw new AutoTranslateError("The Anthropic API key isn't working. Please check it in Vercel.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AutoTranslateError("Too many translations at once. Please wait a minute and try again.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new AutoTranslateError("The translator is busy right now. Please try again in a minute.");
    }
    throw new AutoTranslateError("Couldn't reach the translator. Please try again.");
  }

  const result = response.stop_reason === "refusal" ? null : response.parsed_output;
  if (!result) throw new AutoTranslateError("Couldn't translate this one. Please type the words in yourself.");

  const tidy = (value: ProductTexts, english: ProductTexts): ProductTexts => ({
    name: english.name.trim() ? value.name.trim().slice(0, LIMITS.name) : "",
    shortDescription: english.shortDescription.trim() ? value.shortDescription.trim().slice(0, LIMITS.shortDescription) : "",
    description: english.description.trim() ? value.description.trim().slice(0, LIMITS.description) : "",
  });
  return { ta: tidy(result.ta, texts), hi: tidy(result.hi, texts) };
}
