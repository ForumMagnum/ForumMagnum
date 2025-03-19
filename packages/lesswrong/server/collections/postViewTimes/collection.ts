import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { schema } from '@/lib/collections/postViewTimes/schema';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * Collection containing aggregated data on viewing time for posts (per post, per client id, per day).
 * Used by the author (/users/:_id/stats) and post (/postAnalytics?postId=) analytics pages
 */
export const PostViewTimes = createCollection({
  collectionName: 'PostViewTimes',
  typeName: 'PostViewTime',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PostViewTimes', { clientId: 1, postId: 1, windowStart: 1, windowEnd: 1 }, { unique: true });
    indexSet.addIndex('PostViewTimes', { postId: 1 });
    indexSet.addIndex('PostViewTimes', { windowEnd: 1 });
    indexSet.addIndex('PostViewTimes', { windowStart: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('PostViewTimes'),
  mutations: getDefaultMutations('PostViewTimes'),
  logChanges: true,
});


export default PostViewTimes;
