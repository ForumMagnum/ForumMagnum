import schema from '@/lib/collections/reviewWinnerArts/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * This collection stores information about the LessWrong Annual Review winners, used primarily for sort orderings
 */
export const ReviewWinnerArts = createCollection({
  collectionName: 'ReviewWinnerArts',
  typeName: 'ReviewWinnerArt',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ReviewWinnerArts', { postId: 1 });
    return indexSet;
  },
});


export default ReviewWinnerArts;
