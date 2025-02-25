import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Spotlights: SpotlightsCollection = createCollection({
  collectionName: 'Spotlights',
  typeName: 'Spotlight',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Spotlights', { lastPromotedAt: -1 });
    indexSet.addIndex('Spotlights', { position: -1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('Spotlights'),
  mutations: getDefaultMutations('Spotlights')
});

addUniversalFields({ collection: Spotlights });

makeEditable({
  collection: Spotlights,
  options: {
    fieldName: "description",
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    getLocalStorageId: (spotlight) => {
      if (spotlight._id) { return {id: `spotlight:${spotlight._id}`, verify:true} }
      return {id: `spotlight:create`, verify:true}
    },
    permissions: {
      canRead: ['guests'],
      canUpdate: ['admins', 'sunshineRegiment'],
      canCreate: ['admins', 'sunshineRegiment']
    },
    order: 100
  }
});

export default Spotlights;
