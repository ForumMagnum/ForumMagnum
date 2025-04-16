import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * Cache for link-previews of Arbital links.
 */
export const ArbitalCaches: ArbitalCachesCollection = createCollection({
  collectionName: 'ArbitalCaches',
  typeName: 'ArbitalCaches',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ArbitalCaches', { pageAlias: 1 })
    indexSet.addIndex('ArbitalCaches', { fetchedAt: 1 })
    return indexSet;
  },
});


export default ArbitalCaches;
