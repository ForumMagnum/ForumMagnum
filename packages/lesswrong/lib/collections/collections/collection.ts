import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const Collections: CollectionsCollection = createCollection({
  collectionName: 'Collections',
  typeName: 'Collection',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'mongo',
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
