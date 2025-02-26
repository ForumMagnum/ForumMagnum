import { createCollection } from '../../vulcan-lib/collections';
import { MutationOptions, getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';
import { userIsAdminOrMod } from '../../vulcan-users/permissions';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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
