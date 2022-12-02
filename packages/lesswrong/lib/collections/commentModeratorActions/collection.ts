import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { forumTypeSetting } from '../../instanceSettings';

export const CommentModeratorActions: CommentModeratorActionsCollection = createCollection({
  collectionName: 'CommentModeratorActions',
  typeName: 'CommentModeratorAction',
  collectionType: forumTypeSetting.get() === "EAForum" ? "switching" : "mongo",
  schema,
  resolvers: getDefaultResolvers('CommentModeratorActions'),
  mutations: getDefaultMutations('CommentModeratorActions'),
  logChanges: true,
});

addUniversalFields({collection: CommentModeratorActions});

export default CommentModeratorActions;
