import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { schema } from '@/lib/collections/reviewWinners/schema';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const reviewWinnerMutationOptions: MutationOptions<DbReviewWinner> = {
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
export const ReviewWinners = createCollection({
  collectionName: 'ReviewWinners',
  typeName: 'ReviewWinner',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ReviewWinners', { postId: 1 }, { unique: true });
    indexSet.addIndex('ReviewWinners', { curatedOrder: 1, category: 1 }, { unique: true });
    indexSet.addIndex('ReviewWinners', { reviewYear: 1, reviewRanking: 1 }, { unique: true });
    return indexSet;
  },
  resolvers: getDefaultResolvers('ReviewWinners'),
  mutations: getDefaultMutations('ReviewWinners', reviewWinnerMutationOptions),
  logChanges: true,
});

addUniversalFields({
  collection: ReviewWinners,
});

export default ReviewWinners;
