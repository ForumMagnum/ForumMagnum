import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
// import schema from './schema.js';
import schema from './schema.js';
import { addUniversalFields } from '../../collectionUtils'

export const Collections = createCollection({
  collectionName: 'Collections',

  typeName: 'Collection',

  schema,

  resolvers: getDefaultResolvers('Collections'),

  mutations: getDefaultMutations('Collections'),
});

export default Collections;

addUniversalFields({collection: Collections})