import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Spotlights: SpotlightsCollection = createCollection({
  collectionName: 'Spotlights',
  typeName: 'Spotlight',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Spotlights', { lastPromotedAt: -1 });
    indexSet.addIndex('Spotlights', { position: -1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('Spotlights'),
});


export default Spotlights;
