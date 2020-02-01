import schema from './schema';
import { createCollection } from 'meteor/vulcan:core';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'

export const PostRelations = createCollection({
  collectionName: 'PostRelations',
  typeName: 'PostRelation',
  schema,
  resolvers: getDefaultResolvers('PostRelations')
});

addUniversalFields({collection: PostRelations})

export default PostRelations;
