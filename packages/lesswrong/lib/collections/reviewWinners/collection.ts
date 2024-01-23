import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { MutationOptions, getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';
import { userIsAdmin } from '../../vulcan-users';

/**
 * This collection stores information about the LessWrong Annual Review winners, used primarily for sort orderings
 */

export const reviewWinnerMutationOptions: MutationOptions<DbReviewWinner> = {
  newCheck: (user: DbUser|null, document: DbReviewWinner|null) => {
    return false
  },

  editCheck: (user: DbUser|null, document: DbReviewWinner|null) => {
    return userIsAdmin(user)
  },

  removeCheck: (user: DbUser|null, document: DbReviewWinner|null) => {
    return false
  },
}

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

export default ReviewWinners;
