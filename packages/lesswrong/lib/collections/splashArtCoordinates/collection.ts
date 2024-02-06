import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils';
import { schema } from './schema';
import { userIsAdminOrMod } from '../../vulcan-users';
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';


export const splashArtCoordinatesMutationOptions: MutationOptions<DbSplashArtCoordinate> = {
  newCheck: (user: DbUser|null) => {
    return userIsAdminOrMod(user);
  },

  editCheck: (user: DbUser|null) => {
    return userIsAdminOrMod(user);
  },

  removeCheck: () => {
    return false;
  },
}

export const SplashArtCoordinates: SplashArtCoordinatesCollection = createCollection({ 
  collectionName: 'SplashArtCoordinates',
  typeName: 'SplashArtCoordinate',
  schema,
  resolvers: getDefaultResolvers('SplashArtCoordinates'),
  mutations: getDefaultMutations('SplashArtCoordinates', splashArtCoordinatesMutationOptions),
});

addUniversalFields({ collection: SplashArtCoordinates });

ensureIndex(SplashArtCoordinates, { logTime: 1 }, { unique: true });

export default SplashArtCoordinates;


