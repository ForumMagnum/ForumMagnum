import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
// import schema from './schema.js';
import schema from './schema.js';

const Books = createCollection({
  collectionName: 'Books',

  typeName: 'Book',

  schema,

  resolvers: getDefaultResolvers('Books'),

  mutations: getDefaultMutations('Books'),
});

export default Books;
