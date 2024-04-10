import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';
import { ensureIndex } from '../../collectionIndexUtils';

/**
 * Collection containing aggregated data on viewing time for posts (per post, per client id, per day).
 * Used by the author (/users/:_id/stats) and post (/postAnalytics?postId=) analytics pages
 */
export const PostViewTimes = createCollection({
  collectionName: 'PostViewTimes',
  typeName: 'PostViewTime',
  schema,
  resolvers: getDefaultResolvers('PostViewTimes'),
  mutations: getDefaultMutations('PostViewTimes'),
  logChanges: true,
});

addUniversalFields({
  collection: PostViewTimes,
});

ensureIndex(PostViewTimes, {clientId: 1, postId: 1, windowStart: 1, windowEnd: 1}, {unique: true});
ensureIndex(PostViewTimes, {postId: 1});
ensureIndex(PostViewTimes, {windowEnd: 1});
ensureIndex(PostViewTimes, {windowStart: 1});

export default PostViewTimes;
