
export const getUnusedSlugByCollectionName = async function (collectionName: CollectionNameWithSlug, slug: string, useOldSlugs = false, documentId?: string): Promise<string> {
  throw new Error("Can't run getUnusedSlugByCollectionName on the client");
}

export function addSlugCallbacks<N extends CollectionNameWithSlug>(args: any) {
}
