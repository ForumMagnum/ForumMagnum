import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';

export const CommentApprovals: CommentApprovalsCollection = createCollection({
  collectionName: 'CommentApprovals',
  typeName: 'CommentApproval',
  schema,
  resolvers: getDefaultResolvers('CommentApprovals'),
  mutations: getDefaultMutations('CommentApprovals'),
  logChanges: true,
});

addUniversalFields({collection: CommentApprovals});

export default CommentApprovals;
