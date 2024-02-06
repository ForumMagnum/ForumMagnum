import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils';
import { schema } from './schema';

export const SplashArtCoordinates = createCollection({ // : SplashArtCoordinatesCollection
  collectionName: 'SplashArtCoordinates',
  typeName: 'SplashArtCoordinate',
  schema,
  // resolvers: getDefaultResolvers('SplashArtCoordinates')
});

addUniversalFields({ collection: SplashArtCoordinates });

ensureIndex(SplashArtCoordinates, { logTime: 1 }, { unique: true });

export default SplashArtCoordinates;


