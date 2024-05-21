import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';
import { ensureIndex } from '../../collectionIndexUtils';

/**
 * Collection containing aggregated data on view counts (per post, per day). Used by
 * the author (/users/:_id/stats) and post (/postAnalytics?postId=) analytics pages
 */
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

ensureIndex(PostViews, {postId: 1, windowStart: 1, windowEnd: 1}, {unique: true});
ensureIndex(PostViews, {postId: 1});
ensureIndex(PostViews, {windowEnd: 1});
ensureIndex(PostViews, {windowStart: 1});

export default PostViews;
