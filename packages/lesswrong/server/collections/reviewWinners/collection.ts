import schema from '@/lib/collections/reviewWinners/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

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
});


export default ReviewWinners;
