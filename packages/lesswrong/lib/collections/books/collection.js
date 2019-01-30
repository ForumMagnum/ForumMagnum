import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
// import schema from './schema.js';
import schema from './schema.js';
import { makeEditable } from '../../editor/make_editable.js';

export const Books = createCollection({
  collectionName: 'Books',

  typeName: 'Book',

  schema,

  resolvers: getDefaultResolvers('Books'),

  mutations: getDefaultMutations('Books'),
});

export default Books;

export const makeEditableOptions = {
  order: 20,
  fieldName: "description"
}

makeEditable({
  collection: Books,
  options: makeEditableOptions
})