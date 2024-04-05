import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { MutationOptions, getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';
import { userIsAdminOrMod } from '../../vulcan-users';
import { ensureIndex } from '../../collectionIndexUtils';

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
  resolvers: getDefaultResolvers('ReviewWinners'),
  mutations: getDefaultMutations('ReviewWinners', reviewWinnerMutationOptions),
  logChanges: true,
});

addUniversalFields({
  collection: ReviewWinners,
});

ensureIndex(ReviewWinners, { postId: 1 }, { unique: true });
ensureIndex(ReviewWinners, { curatedOrder: 1, category: 1 }, { unique: true });
ensureIndex(ReviewWinners, { reviewYear: 1, reviewRanking: 1 }, { unique: true });

export default ReviewWinners;
