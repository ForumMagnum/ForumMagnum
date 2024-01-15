import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';

export const PostViews = createCollection({
  collectionName: 'PostViews',
  typeName: 'PostViews',
  schema,
  resolvers: getDefaultResolvers('PostViews'),
  mutations: getDefaultMutations('PostViews'),
  logChanges: true,
});

addUniversalFields({
  collection: PostViews,
});

export default PostViews;
