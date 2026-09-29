import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import Posts from "@/server/collections/posts/collection";
import { postStatuses } from "@/lib/collections/posts/constants";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { inventorySchema, normalizeObUrl } from "./content";

export interface DatedObLink {
  source: string;
  month: string;
  day?: string;
  titleSlug: string;
}

export interface DateTitlePost extends Pick<DbPost, "_id" | "title" | "slug" | "postedAt"> {}

interface MatchedPost {
  postId: string;
  title: string;
  slug: string;
  postedAt: string;
  matchedOn: "title" | "slug" | "title-and-slug";
}

interface DateTitleResult {
  source: string;
  status: "resolved" | "not-found" | "error";
  method: "date-title";
  target?: string;
  date?: string;
  candidates: MatchedPost[];
  reason?: string;
  error?: string;
  excludeFragments: true;
}

/** Only dated article permalinks. Queries and fragments can identify comments. */
export function parseDatedObLink(source: string): DatedObLink | null {
  const normalized = normalizeObUrl(source);
  if (!normalized) return null;
  const url = new URL(source.startsWith("//") ? `http:${source}` : source);
  if (url.search || url.hash) return null;
  const match = /^\/(\d{4})\/(\d{2})\/(?:(\d{2})\/)?([^/]+)\.html$/.exec(url.pathname);
  if (!match) return null;
  const [, year, month, day, encodedSlug] = match;
  const date = `${year}-${month}-${day ?? "01"}`;
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) return null;
  let titleSlug: string;
  try {
    titleSlug = decodeURIComponent(encodedSlug);
  } catch {
    return null;
  }
  if (!/[a-z]/i.test(titleSlug) || /[/.?#]/.test(titleSlug)) return null;
  return { source: normalized, month: `${year}-${month}`, ...(day ? { day: date } : {}), titleSlug };
}

function asciiTitle(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[’‘]/g, "'");
}

function compactTitle(value: string): string {
  return asciiTitle(value).replace(/[^a-z0-9]/g, "");
}

/** Exact normalized titles, or a generated 15-character TypePad slug prefix.
 * No edit distance, arbitrary short prefixes, date widening, or ranked guesses.
 */
function matchesTitle(titleSlug: string, value: string): boolean {
  const compact = compactTitle(titleSlug);
  if (!compact) return false;
  if (compact === compactTitle(value)) return true;
  const separated = asciiTitle(value).replace(/[\s_-]+/g, "-");
  // Older slugs vary in whether punctuation was removed before or after the
  // 15-character cutoff. Retain the apostrophe variant for archimedess_chr.
  const variants = [
    separated.replace(/[^a-z0-9-]/g, ""),
    separated.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-"),
    separated.replace(/[^a-z0-9'-]/g, ""),
    // Some old slugs removed intra-word hyphens before turning spaces into
    // separators, e.g. "Self-Deception, Hypocrisy..." -> selfdeception_h.
    asciiTitle(value).replace(/[^a-z0-9\s_]/g, "").replace(/[\s_]+/g, "-"),
  ];
  for (const variant of variants) {
    const trimmed = variant.replace(/^-+|-+$/g, "");
    if (trimmed.length > 15 && compact === compactTitle(trimmed.slice(0, 15))) return true;
  }
  return false;
}

/** Accept only one distinct matching post across both its title and current slug. */
export function matchDatedObLink(link: DatedObLink, posts: readonly DateTitlePost[]): DateTitleResult {
  const candidates = new Map<string, MatchedPost>();
  for (const post of posts) {
    const postedAt = post.postedAt.toISOString();
    if (!postedAt.startsWith(link.day ?? link.month)) continue;
    const titleMatch = matchesTitle(link.titleSlug, post.title);
    const slugMatch = matchesTitle(link.titleSlug, post.slug);
    if (!titleMatch && !slugMatch) continue;
    candidates.set(post._id, {
      postId: post._id, title: post.title, slug: post.slug, postedAt,
      matchedOn: titleMatch && slugMatch ? "title-and-slug" : titleMatch ? "title" : "slug",
    });
  }
  const matches = [...candidates.values()];
  const base = { source: link.source, date: link.day ?? link.month, candidates: matches };
  if (matches.length !== 1) {
    return {
      ...base, method: "date-title", excludeFragments: true,
      status: matches.length ? "error" : "not-found",
      reason: matches.length ? "ambiguous" : "no-match",
      ...(matches.length ? { error: `${matches.length} posts match the date and title slug` } : {}),
    };
  }
  const match = matches[0];
  return {
    ...base, method: "date-title", excludeFragments: true, status: "resolved",
    target: new URL(postGetPageUrl({ _id: match.postId, slug: match.slug }), "https://www.lesswrong.com").href,
  };
}

function logProgress(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[OB date/title] ${message}`);
}

/** Read-only DB script. Writes a NEW lookup file compatible with the rewrite step. */
export async function resolveOvercomingBiasLinksByDateAndTitle(inventoryPath: string, outputPath: string) {
  if (resolve(inventoryPath) === resolve(outputPath)) throw new Error("Output must not overwrite the inventory");
  const inventory = inventorySchema.parse(JSON.parse(await readFile(inventoryPath, "utf8")));
  const byMonth = new Map<string, DatedObLink[]>();
  const results = new Map<string, DateTitleResult>();
  for (const source of inventory.urls) {
    const link = parseDatedObLink(source);
    if (!link) {
      results.set(source, { source, status: "not-found", method: "date-title", excludeFragments: true, candidates: [], reason: "not-a-dated-post-link" });
      continue;
    }
    const links = byMonth.get(link.month) ?? [];
    links.push(link);
    byMonth.set(link.month, links);
  }
  logProgress(`${inventory.urls.length} URLs; ${results.size} excluded; ${byMonth.size} months to query. No archive.org requests.`);
  let queried = 0;
  for (const [month, links] of [...byMonth.entries()].sort()) {
    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const posts: DateTitlePost[] = await Posts.find({
      postedAt: { $gte: start, $lt: end },
      draft: false, deletedDraft: false, unlisted: false, status: postStatuses.STATUS_APPROVED,
    }, {
      sort: { postedAt: 1, _id: 1 },
    }, { _id: 1, title: 1, slug: 1, postedAt: 1 }).fetch();
    let matched = 0;
    for (const link of links) {
      const result = matchDatedObLink(link, posts);
      results.set(link.source, result);
      if (result.status === "resolved") matched++;
    }
    queried++;
    logProgress(`[${queried}/${byMonth.size}] ${month}: ${posts.length} posts, ${links.length} URLs, ${matched} uniquely matched`);
  }
  const counts = { resolved: 0, ambiguous: 0, unmatched: 0, excluded: 0 };
  for (const result of results.values()) {
    if (result.status === "resolved") counts.resolved++;
    else if (result.reason === "ambiguous") counts.ambiguous++;
    else if (result.reason === "no-match") counts.unmatched++;
    else counts.excluded++;
  }
  // Keep the slower archive lookup's existing checkpoint intact. An existing
  // output file is an error; choose a new filename for each comparison run.
  await writeFile(outputPath, JSON.stringify([...results.values()], null, 2), { flag: "wx" });
  logProgress(`Saved ${resolve(outputPath)}: ${JSON.stringify(counts)}`);
  return counts;
}
