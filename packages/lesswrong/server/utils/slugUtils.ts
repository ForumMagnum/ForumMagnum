import { getCollection } from '../../lib/vulcan-lib/getCollection';

// LESSWRONG version of getting unused slug. Modified to also include "oldSlugs" array
export async function getUnusedSlug<T extends HasSlugType>(collection: CollectionBase<HasSlugType>, slug: string, useOldSlugs = false, documentId?: string): Promise<string> {
  let suffix = '';
  let index = 0;
  
  let existingDocuments = await getDocumentsBySlug({slug, suffix, useOldSlugs, collection})
  // test if slug is already in use
  while (!!existingDocuments?.length) {
    // Filter out our own document (i.e. don't change the slug if the only conflict is with ourselves)
    const conflictingDocuments = existingDocuments.filter((doc) => doc._id !== documentId)
    // If there are other documents we conflict with, change the index and slug, then check again
    if (!!conflictingDocuments.length) {
      index++
      suffix = '-'+index;
      existingDocuments = await getDocumentsBySlug({slug, suffix, useOldSlugs, collection})
    } else {
      break
    }
  }
  return slug+suffix;
};

const getDocumentsBySlug = async <T extends HasSlugType>({slug, suffix, useOldSlugs, collection}: {
  slug: string,
  suffix: string,
  useOldSlugs: boolean,
  collection: CollectionBase<T>
}): Promise<Array<T>> => {
  return await collection.find(useOldSlugs ? 
    {$or: [{slug: slug+suffix},{oldSlugs: slug+suffix}]} : 
    {slug: slug+suffix}
  ).fetch()
}

// LESSWRONG version of getting unused slug by collection name. Modified to also include "oldSlugs" array
export async function getUnusedSlugByCollectionName(collectionName: CollectionNameString, slug: string, useOldSlugs = false, documentId?: string): Promise<string> {
  // Not enforced: collectionName is a collection that has slugs
  const collection = getCollection(collectionName) as CollectionBase<HasSlugType>;
  return await getUnusedSlug(collection, slug, useOldSlugs, documentId)
};

export async function slugIsUsed(collectionName: CollectionNameString, slug: string): Promise<boolean> {
  const collection = getCollection(collectionName)
  const existingUserWithSlug = await collection.findOne({$or: [
    {slug: slug}, {oldSlugs: slug}
  ]});
  return !!existingUserWithSlug
}
