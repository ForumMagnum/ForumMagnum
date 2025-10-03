import schema from '@/lib/collections/commentModeratorActions/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const CommentModeratorActions = createCollection({
  collectionName: 'CommentModeratorActions',
  typeName: 'CommentModeratorAction',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CommentModeratorActions', { commentId: 1, createdAt: -1 })
    return indexSet;
  },
});


export default CommentModeratorActions;
