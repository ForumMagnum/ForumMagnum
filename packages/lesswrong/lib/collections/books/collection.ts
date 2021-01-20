import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { makeEditable, MakeEditableOptions } from '../../editor/make_editable';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

export const Books: BooksCollection = createCollection({
  collectionName: 'Books',
  typeName: 'Book',
  schema,
  resolvers: getDefaultResolvers('Books'),
  mutations: getDefaultMutations('Books'),
});

export const makeEditableOptions: MakeEditableOptions = {
  order: 20,
  getLocalStorageId: (book, name) => {
    if (book._id) { return {id: `${book._id}_${name}`, verify: true} }
    return {id: `collection: ${book.collectionId}_${name}`, verify: false}
  },
}

makeEditable({
  collection: Books,
  options: makeEditableOptions
})
addUniversalFields({collection: Books})

export default Books;
