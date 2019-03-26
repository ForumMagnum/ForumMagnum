import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
// import schema from './schema.js';
import schema from './schema.js';
import { makeEditable } from '../../editor/make_editable.js';
import { addUniversalFields } from '../../collectionUtils'

export const Books = createCollection({
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