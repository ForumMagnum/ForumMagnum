import { getCollectionAccessFilter } from "@/server/permissions/accessFilters";

export async function findAccessiblePostByIdOrSlug(
  idOrSlug: string,
  resolverContext: ResolverContext
): Promise<DbPost | null> {
  const [byId, bySlug] = await Promise.all([
    resolverContext.loaders.Posts.load(idOrSlug),
    resolverContext.Posts.findOne({slug: idOrSlug}),
  ]);
  if (bySlug) {
    resolverContext.loaders.Posts.prime(idOrSlug, bySlug);
  }
  const post = byId ?? bySlug;
  if (!post) {
    return null;
  }

  const checkAccess = getCollectionAccessFilter("Posts");
  return await checkAccess(resolverContext.currentUser, post, resolverContext)
    ? post
    : null;
}
