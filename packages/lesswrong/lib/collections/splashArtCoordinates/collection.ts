import { createCollection } from '../../vulcan-lib/collections';
import { schema } from './schema';
import { userIsAdminOrMod } from '../../vulcan-users/permissions';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

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
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('SplashArtCoordinates', { reviewWinnerArtId: 1, createdAt: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('SplashArtCoordinates'),
  mutations: getDefaultMutations('SplashArtCoordinates', splashArtCoordinatesMutationOptions),
});

export default SplashArtCoordinates;
