import schema from '@/lib/collections/commentModeratorActions/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const CommentModeratorActions: CommentModeratorActionsCollection = createCollection({
  collectionName: 'CommentModeratorActions',
  typeName: 'CommentModeratorAction',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CommentModeratorActions', { commentId: 1, createdAt: -1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('CommentModeratorActions'),
  mutations: getDefaultMutations('CommentModeratorActions'),
  logChanges: true,
});


export default CommentModeratorActions;
