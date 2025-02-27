import { createCollection } from '../../vulcan-lib/collections';
import schema from './schema';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
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

makeEditable({
  collection: Books,
  options: {
    order: 20,
    getLocalStorageId: (book, name) => {
      if (book._id) { return {id: `${book._id}_${name}`, verify: true} }
      return {id: `collection: ${book.collectionId}_${name}`, verify: false}
    },
  }
})
addUniversalFields({collection: Books})

export default Books;
