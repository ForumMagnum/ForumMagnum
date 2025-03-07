import { createCollection } from '../../vulcan-lib/collections';
import schema from './schema';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Books: BooksCollection = createCollection({
  collectionName: 'Books',
  typeName: 'Book',
  schema,
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
