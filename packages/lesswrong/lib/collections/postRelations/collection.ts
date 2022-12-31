import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const PostRelations: PostRelationsCollection = createCollection({
  collectionName: 'PostRelations',
  typeName: 'PostRelation',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'mongo',
  schema,
  resolvers: getDefaultResolvers('PostRelations'),
  logChanges: true,
});

addUniversalFields({collection: PostRelations})

export default PostRelations;
