import { crosspostUserAgent } from "@/lib/apollo/links";
import { z } from "zod";

const postTranslationSchema = z.object({
  url: z.string(),
  title: z.string(),
  language: z.string(),
}).passthrough();

const translationsDataSchema = z.record(z.string(), z.array(postTranslationSchema));

export type PostTranslation = z.infer<typeof postTranslationSchema>;
type TranslationsData = z.infer<typeof translationsDataSchema>;

const TRANSLATIONS_API_URL = "https://ea.international/api/translations/forummagnum";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

let cachedTranslationsData: TranslationsData | null = null;
let cacheExpiry = 0;

async function fetchTranslationsData(): Promise<TranslationsData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s timeout
  try {
    const response = await fetch(TRANSLATIONS_API_URL, {
      headers: { "User-Agent": crosspostUserAgent },
      signal: controller.signal,
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Post translations API returned ${response.status}`);
      return null;
    }

    const json = await response.json();
    const parsed = translationsDataSchema.safeParse(json);
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.error("Post translations API returned invalid data:", parsed.error);
      return null;
    }

    return parsed.data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching post translations:", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getTranslationsData(): Promise<TranslationsData | null> {
  const now = Date.now();
  if (cachedTranslationsData && now < cacheExpiry) {
    return cachedTranslationsData;
  }
  const data = await fetchTranslationsData();
  if (data) {
    cachedTranslationsData = data;
    cacheExpiry = now + CACHE_TTL_MS;
  }
  return data;
}

export async function getPostTranslations(postId: string): Promise<PostTranslation[]> {
  const data = await getTranslationsData();
  return data?.[postId] ?? [];
}

export async function initPostTranslationsCache() {
  await getTranslationsData();
}
