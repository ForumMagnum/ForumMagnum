import { z } from "zod";
import { collectionNameSchema, type LinkRepair } from "@/scripts/contentLinkRepair/content";

export const inventorySchema = z.object({
  urls: z.array(z.string()),
  documents: z.array(z.object({
    collectionName: collectionNameSchema,
    documentId: z.string(),
  })),
});

export const lookupResultSchema = z.object({
  source: z.string(),
  status: z.enum(["resolved", "not-found", "error"]),
  target: z.string().optional(),
  archivedTarget: z.string().optional(),
  snapshot: z.string().optional(),
  error: z.string().optional(),
  excludeFragments: z.boolean().optional(),
});

export interface LookupResult extends z.infer<typeof lookupResultSchema> {}

/** CDX treats http/https and www/apex alike. Fragments are not sent to servers. */
export function normalizeObUrl(value: string): string | null {
  try {
    const url = new URL(value.startsWith("//") ? `http:${value}` : value);
    if (!["http:", "https:"].includes(url.protocol)
      || !["overcomingbias.com", "www.overcomingbias.com"].includes(url.hostname)
      || url.username || url.password || url.port) return null;
    url.protocol = "http:";
    url.hostname = "www.overcomingbias.com";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function parseLwUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)
      || !["lesswrong.com", "www.lesswrong.com"].includes(url.hostname)
      || url.username || url.password || url.port) return null;
    return url;
  } catch {
    return null;
  }
}

export function replacementUrl(value: string, replacements: ReadonlyMap<string, string>, excludeFragmentSources?: ReadonlySet<string>): string {
  const source = normalizeObUrl(value);
  const target = source && replacements.get(source);
  if (!target) return value;
  const url = new URL(target);
  const original = new URL(value.startsWith("//") ? `http:${value}` : value);
  if (source && original.hash && excludeFragmentSources?.has(source)) return value;
  // HTTP redirects inherit the original fragment unless Location supplies one.
  if (!url.hash) url.hash = original.hash;
  return url.href;
}

export function obLinkRepair(replacements: ReadonlyMap<string, string> = new Map(), excludeFragmentSources?: ReadonlySet<string>): LinkRepair {
  return {
    normalize: normalizeObUrl,
    replace: href => replacementUrl(href, replacements, excludeFragmentSources),
    commitMessage: "Repair archived Overcoming Bias links to LessWrong",
    preservedDraftCommitMessage: "Preserve unpublished draft after Overcoming Bias link repair",
  };
}
