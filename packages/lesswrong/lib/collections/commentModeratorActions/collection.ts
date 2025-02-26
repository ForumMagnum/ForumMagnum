import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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

addUniversalFields({collection: CommentModeratorActions});

export default CommentModeratorActions;
