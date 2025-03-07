import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { schema } from './schema';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * Collection containing aggregated data on view counts (per post, per day). Used by
 * the author (/users/:_id/stats) and post (/postAnalytics?postId=) analytics pages
 */
export const PostViews = createCollection({
  collectionName: 'PostViews',
  typeName: 'PostViews',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PostViews', { postId: 1, windowStart: 1, windowEnd: 1 }, { unique: true });
    indexSet.addIndex('PostViews', { postId: 1 });
    indexSet.addIndex('PostViews', { windowEnd: 1 });
    indexSet.addIndex('PostViews', { windowStart: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('PostViews'),
  mutations: getDefaultMutations('PostViews'),
  logChanges: true,
});

export default PostViews;
