import { createCollection } from '../../vulcan-lib/collections';
import schema from './schema';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
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

addUniversalFields({
  collection: Collections,
  createdAtOptions: {
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },
});

export default Collections;
