import schema from '@/lib/collections/spotlights/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
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


export default Spotlights;
