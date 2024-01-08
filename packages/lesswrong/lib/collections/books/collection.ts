import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

export const Books: BooksCollection = createCollection({
  collectionName: 'Books',
  typeName: 'Book',
  schema,
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
