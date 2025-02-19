import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

export const Collections: CollectionsCollection = createCollection({
  collectionName: 'Collections',
  typeName: 'Collection',
  schema,
  resolvers: getDefaultResolvers('Collections'),
  mutations: getDefaultMutations('Collections'),
  logChanges: true,
});

makeEditable({
  collection: Collections,
  options: {
    order: 20
  }
})

addUniversalFields({
  collection: Collections,
  createdAtOptions: {
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },
});

export default Collections;
