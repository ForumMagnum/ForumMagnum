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
});

export const makeEditableOptions = {
  order: 20
}

makeEditable({
  collection: Books,
  options: makeEditableOptions
})
addUniversalFields({collection: Books})

export default Books;
