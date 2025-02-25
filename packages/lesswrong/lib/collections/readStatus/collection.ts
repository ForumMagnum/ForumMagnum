import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from '../../collectionUtils';
import { ensureCustomPgIndex, ensureIndex } from '../../collectionIndexUtils'
import { foreignKeyField } from '../../utils/schemaUtils'

const schema: SchemaType<"ReadStatuses"> = {
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
  logChanges: false,
});

addUniversalFields({collection: ReadStatuses});

void ensureCustomPgIndex(`
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_ReadStatuses_userId_postId_tagId"
  ON public."ReadStatuses" USING btree
  (COALESCE("userId", ''::character varying), COALESCE("postId", ''::character varying), COALESCE("tagId", ''::character varying))
`);
ensureIndex(ReadStatuses, {userId:1, postId:1, isRead:1, lastUpdated:1})
ensureIndex(ReadStatuses, {userId:1, tagId:1, isRead:1, lastUpdated:1})

export default ReadStatuses;
