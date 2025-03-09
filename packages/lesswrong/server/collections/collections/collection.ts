import { createCollection } from '@/lib/vulcan-lib/collections';
import schema from '@/lib/collections/collections/schema';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Collections: CollectionsCollection = createCollection({
  collectionName: 'Collections',
  typeName: 'Collection',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    // Used in Posts and Sequences canonicalCollection resolvers
    indexSet.addIndex('Collections', { slug: "hashed" });
    return indexSet;
  },
  resolvers: getDefaultResolvers('Collections'),
  mutations: getDefaultMutations('Collections'),
  logChanges: true,
});


export default Collections;
