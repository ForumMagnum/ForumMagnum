import { createCollection } from '../../vulcan-lib/collections';
import { ensureIndex } from '../../collectionIndexUtils';
import { schema } from './schema';
import { userIsAdminOrMod } from '../../vulcan-users/permissions';
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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

ensureIndex(SplashArtCoordinates, { reviewWinnerArtId: 1, createdAt: 1 });

export default SplashArtCoordinates;
