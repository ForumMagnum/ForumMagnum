import { createCollection } from '../../vulcan-lib/collections';
import { MutationOptions, getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';
import { userIsAdminOrMod } from '../../vulcan-users/permissions';
import { ensureIndex } from '../../collectionIndexUtils';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
  resolvers: getDefaultResolvers('ReviewWinnerArts'),
  mutations: getDefaultMutations('ReviewWinnerArts', reviewWinnerArtMutationOptions),
  logChanges: true,
});

addUniversalFields({
  collection: ReviewWinnerArts,
});

ensureIndex(ReviewWinnerArts, { postId: 1 });

export default ReviewWinnerArts;
