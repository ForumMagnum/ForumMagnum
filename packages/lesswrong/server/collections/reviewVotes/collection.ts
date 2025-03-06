import schema from '@/lib/collections/reviewVotes/schema';
import { userCanDo } from '@/lib/vulcan-users/permissions';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { sunshineRegimentGroup } from '@/lib/permissions';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
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
