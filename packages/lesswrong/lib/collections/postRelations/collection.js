import schema from './schema.js';
import { getDefaultResolvers, createCollection } from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'

export const PostRelations = createCollection({
  collectionName: 'PostRelations',
  typeName: 'PostRelation',
  schema,
  resolvers: getDefaultResolvers('PostRelations')
});

addUniversalFields({collection: PostRelations})

export default PostRelations;
