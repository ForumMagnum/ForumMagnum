import { crosspostUserAgent } from "@/lib/apollo/links";

export interface PostTranslation {
  url: string;
  title: string;
  language: string;
}

type TranslationsData = Record<string, PostTranslation[]>;

const TRANSLATIONS_API_URL = "https://ea.international/api/translations/forummagnum";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

let cachedTranslationsData: TranslationsData | null = null;
let cacheExpiry = 0;

async function fetchTranslationsData(): Promise<TranslationsData | null> {
  try {
    const response = await fetch(TRANSLATIONS_API_URL, {
      headers: { "User-Agent": crosspostUserAgent },
    });
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Post translations API returned ${response.status}`);
      return null;
    }
    return await response.json() as TranslationsData;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching post translations:", error);
    return null;
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
