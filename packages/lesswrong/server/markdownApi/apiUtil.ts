import type { NextRequest } from "next/server";

const truthyValues = new Set(["1", "true", "yes", "on"]);

export function parseBooleanParam(value: string | null): boolean {
  if (!value) return false;
  return truthyValues.has(value.toLowerCase());
}

/**
 * Whether markdown was requested with `?webLinks=1`, meaning it's for a user
 * (eg the "Copy Markdown" menu item) rather than an AI agent: onsite links
 * should point at the regular HTML pages rather than the markdown API, and
 * should be absolute.
 */
export function isWebLinksRequest(req: NextRequest): boolean {
  return parseBooleanParam(req.nextUrl.searchParams.get("webLinks"));
}

export async function findPostByIdOrSlug(idOrSlug: string, resolverContext: ResolverContext): Promise<DbPost> {
  const [byId, bySlug] = await Promise.all([
    resolverContext.loaders.Posts.load(idOrSlug),
    resolverContext.Posts.findOne({slug: idOrSlug}),
  ]);
  if (bySlug) {
    resolverContext.loaders.Posts.prime(idOrSlug, bySlug);
  }
  return byId ?? bySlug;
}
