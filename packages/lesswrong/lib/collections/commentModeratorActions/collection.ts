import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const CommentModeratorActions: CommentModeratorActionsCollection = createCollection({
  collectionName: 'CommentModeratorActions',
  typeName: 'CommentModeratorAction',
  schema,
  resolvers: getDefaultResolvers('CommentModeratorActions'),
  mutations: getDefaultMutations('CommentModeratorActions'),
  logChanges: true,
});

addUniversalFields({collection: CommentModeratorActions});

export default CommentModeratorActions;
