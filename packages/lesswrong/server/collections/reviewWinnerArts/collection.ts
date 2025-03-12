import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { schema } from '@/lib/collections/reviewWinnerArts/schema';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const reviewWinnerArtMutationOptions: MutationOptions<DbReviewWinnerArt> = {
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

/**
 * This collection stores information about the LessWrong Annual Review winners, used primarily for sort orderings
 */
export const ReviewWinnerArts = createCollection({
  collectionName: 'ReviewWinnerArts',
  typeName: 'ReviewWinnerArt',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ReviewWinnerArts', { postId: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('ReviewWinnerArts'),
  mutations: getDefaultMutations('ReviewWinnerArts', reviewWinnerArtMutationOptions),
  logChanges: true,
});


export default ReviewWinnerArts;
