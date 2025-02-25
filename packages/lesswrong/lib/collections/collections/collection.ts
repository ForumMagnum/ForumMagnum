import { createCollection } from '../../vulcan-lib/collections';
import schema from './schema';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";

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
