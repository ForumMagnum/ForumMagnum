import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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

addUniversalFields({
  collection: PostViewTimes,
});

export default PostViewTimes;
