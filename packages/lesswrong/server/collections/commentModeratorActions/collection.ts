import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const CommentModeratorActions: CommentModeratorActionsCollection = createCollection({
  collectionName: 'CommentModeratorActions',
  typeName: 'CommentModeratorAction',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CommentModeratorActions', { commentId: 1, createdAt: -1 })
    return indexSet;
  },
  logChanges: true,
});


export default CommentModeratorActions;
