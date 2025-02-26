import schema from './schema';
import { userCanDo } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib/collections';
import { sunshineRegimentGroup } from '../../permissions';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ReviewVotes: ReviewVotesCollection = createCollection({
  collectionName: 'ReviewVotes',
  typeName: 'ReviewVote',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ReviewVotes', {year: 1, userId: 1, dummy: 1});
    indexSet.addIndex('ReviewVotes', {postId: 1});
    indexSet.addIndex('ReviewVotes', {postId: 1, userId: 1})
    indexSet.addIndex('ReviewVotes', {year: 1, dummy: 1, createdAt: -1});
    return indexSet;
  },
  resolvers: getDefaultResolvers('ReviewVotes'),
});

addUniversalFields({collection: ReviewVotes})

ReviewVotes.checkAccess = async (user: DbUser|null, document: DbReviewVote, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? userCanDo(user, 'reviewVotes.view.own') : userCanDo(user, `reviewVotes.view.all`)
  )
};

export default ReviewVotes;
