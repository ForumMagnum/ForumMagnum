import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const JargonTerms: JargonTermsCollection = createCollection({
  collectionName: 'JargonTerms',
  typeName: 'JargonTerm',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('JargonTerms', { postId: 1, term: 1, createdAt: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('JargonTerms'),
  logChanges: true,
});

export default JargonTerms;
