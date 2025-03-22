import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ReadStatuses: ReadStatusesCollection = createCollection({
  collectionName: "ReadStatuses",
  typeName: "ReadStatus",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addCustomPgIndex(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_ReadStatuses_userId_postId_tagId"
      ON public."ReadStatuses" USING btree
      (COALESCE("userId", ''::character varying), COALESCE("postId", ''::character varying), COALESCE("tagId", ''::character varying))
    `);
    indexSet.addIndex('ReadStatuses', { userId: 1, postId: 1 });
    indexSet.addIndex('ReadStatuses', { userId: 1, tagId: 1 });
    return indexSet;
  },
  logChanges: false,
});


export default ReadStatuses;
