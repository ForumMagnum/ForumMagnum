import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

interface ExtendedCollectionsCollection extends CollectionsCollection {
  // Functions in lib/collections/collections/helpers.ts
  getAllPostIDs: (collectionID: string) => Promise<Array<string>>
  getPageUrl: (collection: CollectionsPageFragment|DbCollection, isAbsolute?: boolean) => string
}

export const Collections: ExtendedCollectionsCollection = createCollection({
  collectionName: 'Collections',
  typeName: 'Collection',
  schema,
  resolvers: getDefaultResolvers('Collections'),
  mutations: getDefaultMutations('Collections'),
});

export const makeEditableOptions = {
  order: 20
}

makeEditable({
  collection: Collections,
  options: makeEditableOptions
})
addUniversalFields({collection: Collections})

export default Collections;
