import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ReviewVotes: ReviewVotesCollection = createCollection({
  collectionName: 'ReviewVotes',
  typeName: 'ReviewVote',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ReviewVotes', {year: 1, userId: 1, dummy: 1});
    indexSet.addIndex('ReviewVotes', {postId: 1});
    indexSet.addIndex('ReviewVotes', {postId: 1, userId: 1})
    indexSet.addIndex('ReviewVotes', {year: 1, dummy: 1, createdAt: -1});
    return indexSet;
  },
});

export default ReviewVotes;
