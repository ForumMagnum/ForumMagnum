import schema from '@/lib/collections/splashArtCoordinates/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const SplashArtCoordinates = createCollection({ 
  collectionName: 'SplashArtCoordinates',
  typeName: 'SplashArtCoordinate',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('SplashArtCoordinates', { reviewWinnerArtId: 1, createdAt: 1 });
    return indexSet;
  },
});


export default SplashArtCoordinates;
