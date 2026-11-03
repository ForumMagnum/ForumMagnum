import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { Posts } from "@/server/collections/posts/collection";
import type { LinkRepair } from "@/scripts/contentLinkRepair/content";
import { collectLinkDocuments, repairLinkDocuments } from "@/scripts/contentLinkRepair/repair";

// Until 2025-09, linkpost links went through the /out click-tracking redirect,
// and some of those links were copied into posts, comments, and linkpost URLs.
// /out was an open redirect and has been removed; this replaces each LW/AF /out
// link with its destination. Dry-run by default:
//
//   yarn repl dev lw packages/lesswrong/scripts/unwrapOutRedirectLinks.ts 'unwrapOutRedirectLinks("/tmp/out-preview.jsonl")'
//   yarn repl dev lw packages/lesswrong/scripts/unwrapOutRedirectLinks.ts 'unwrapOutRedirectLinks("/tmp/out-applied.jsonl", { dryRun: false })'
//
// Posts and comments get a patch revision, as in overcomingBiasLinks/README.md.

const outRedirectHostnames = ["lesswrong.com", "www.lesswrong.com", "alignmentforum.org", "www.alignmentforum.org"];

function parseOutRedirectUrl(href: string): URL | null {
  try {
    // Relative links in LW/AF content resolve against the site they're on.
    const url = new URL(href, "https://www.lesswrong.com");
    if (!["http:", "https:"].includes(url.protocol)
      || !outRedirectHostnames.includes(url.hostname)
      || url.pathname !== "/out") return null;
    return url;
  } catch {
    return null;
  }
}

/** Where an LW/AF /out link redirected to, or null if it isn't one or lacks a valid http(s) destination. */
export function outRedirectDestination(href: string): string | null {
  const outUrl = parseOutRedirectUrl(href);
  const destination = outUrl?.searchParams.get("url");
  if (!outUrl || !destination) return null;
  try {
    const url = new URL(destination);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    // HTTP redirects inherit the original fragment unless Location supplies one.
    if (!url.hash) url.hash = outUrl.hash;
    return url.href;
  } catch {
    return null;
  }
}

export const outRedirectLinkRepair: LinkRepair = {
  normalize: href => parseOutRedirectUrl(href) ? href : null,
  replace: href => outRedirectDestination(href) ?? href,
  commitMessage: "Replace links through the removed /out redirect with their destinations",
  preservedDraftCommitMessage: "Preserve unpublished draft after /out redirect link repair",
};

interface LinkpostUrlRepair {
  postId: string;
  from: string;
  to: string | null;
}

async function repairLinkpostUrls(dryRun: boolean): Promise<LinkpostUrlRepair[]> {
  const db = getSqlClientOrThrow();
  const posts = await db.any<{ _id: string; url: string }>(`
    -- unwrapOutRedirectLinks.linkposts
    SELECT _id, url FROM "Posts" WHERE url ILIKE '%/out?url=%'
  `);
  const repairs: LinkpostUrlRepair[] = [];
  for (const { _id, url } of posts) {
    if (!parseOutRedirectUrl(url)) continue;
    const destination = outRedirectDestination(url);
    if (destination && !dryRun) {
      await Posts.rawUpdateOne({ _id }, { $set: { url: destination } });
    }
    repairs.push({ postId: _id, from: url, to: destination });
  }
  return repairs;
}

/** Dry-run by default. Only { dryRun: false } writes revisions and linkpost URLs. */
export async function unwrapOutRedirectLinks(reportPath: string, { dryRun = true }: { dryRun?: boolean } = {}) {
  const inventory = await collectLinkDocuments(outRedirectLinkRepair, "%/out?url=%");
  const stats = await repairLinkDocuments(inventory.documents, outRedirectLinkRepair, reportPath, dryRun);
  return {
    ...stats,
    collectionErrors: inventory.errors,
    // These are left unchanged, and will 404.
    unresolvedUrls: inventory.urls.filter(url => !outRedirectDestination(url)),
    linkposts: await repairLinkpostUrls(dryRun),
  };
}
