import { createCollection } from '../../vulcan-lib/collections';
import { universalFields } from '../../collectionUtils';
import { foreignKeyField } from '../../utils/schemaUtils'
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const schema: SchemaType<"ReadStatuses"> = {
  ...universalFields({}),
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
  },
  tagId: {
    ...foreignKeyField({
      idFieldName: "tagId",
      resolverName: "tag",
      collectionName: "Tags",
      type: "Tag",
      nullable: true,
    }),
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    nullable: false,
  },
  isRead: {
    type: Boolean,
    nullable: false,
  },
  lastUpdated: {
    type: Date,
    nullable: false,
  },
};

export const ReadStatuses: ReadStatusesCollection = createCollection({
  collectionName: "ReadStatuses",
  typeName: "ReadStatus",
  schema,
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
