import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { MutationOptions, getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';
import { mongoFindOne } from '../../mongoQueries';
import { userCanDo, userIsAdmin } from '../../vulcan-users';

/**
 * 
 * 
 */

export const commentMutationOptions: MutationOptions<DbReviewWinner> = {
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
  mutations: getDefaultMutations('ReviewWinners'),
  logChanges: true,
});

addUniversalFields({
  collection: ReviewWinners,
});

export default ReviewWinners;
