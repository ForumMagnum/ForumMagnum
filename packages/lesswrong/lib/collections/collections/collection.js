import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
// import schema from './schema.js';
import schema from './schema.js';

const Collections = createCollection({
  collectionName: 'Collections',

  typeName: 'Collection',

  schema,

  resolvers: getDefaultResolvers('Collections'),

  mutations: getDefaultMutations('Collections'),
});

export default Collections;
