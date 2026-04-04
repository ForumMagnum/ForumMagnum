import schema from '@/lib/collections/linkPreviewCaches/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * Cache for cross-site link previews.
 */
export const LinkPreviewCaches = createCollection({
  collectionName: 'LinkPreviewCaches',
  typeName: 'LinkPreviewCaches',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LinkPreviewCaches', { url: 1 }, { unique: true });
    indexSet.addIndex('LinkPreviewCaches', { nextRefreshAt: 1 });
    indexSet.addIndex('LinkPreviewCaches', { fetchedAt: 1 });
    indexSet.addIndex('LinkPreviewCaches', { cacheVersion: 1 });
    return indexSet;
  },
});

export default LinkPreviewCaches;
