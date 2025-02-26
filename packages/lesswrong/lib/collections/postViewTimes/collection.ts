import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { schema } from './schema';
import { ensureIndex } from '../../collectionIndexUtils';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
