import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Books: BooksCollection = createCollection({
  collectionName: 'Books',
  typeName: 'Book',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Books', { collectionId: 1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('Books'),
  mutations: getDefaultMutations('Books'),
  logChanges: true,
});


export default Books;
