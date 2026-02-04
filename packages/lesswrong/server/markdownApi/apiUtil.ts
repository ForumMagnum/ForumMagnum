
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
