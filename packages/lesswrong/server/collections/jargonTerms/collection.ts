import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const JargonTerms: JargonTermsCollection = createCollection({
  collectionName: 'JargonTerms',
  typeName: 'JargonTerm',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('JargonTerms', { postId: 1, term: 1, createdAt: 1 });
    return indexSet;
  },
});

export default JargonTerms;
