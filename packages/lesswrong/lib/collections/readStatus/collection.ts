import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils';
import { ensureCustomPgIndex, ensureIndex } from '../../collectionIndexUtils'
import { foreignKeyField } from '../../utils/schemaUtils'
import { userIsAdmin, userOwns } from '@/lib/vulcan-users';

const schema: SchemaType<"ReadStatuses"> = {
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    canRead: [userOwns, 'admins'],
  },
  tagId: {
    ...foreignKeyField({
      idFieldName: "tagId",
      resolverName: "tag",
      collectionName: "Tags",
      type: "Tag",
      nullable: true,
    }),
    canRead: [userOwns, 'admins'],
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
    canRead: [userOwns, 'admins'],
  },
  isRead: {
    type: Boolean,
    nullable: false,
    canRead: [userOwns, 'admins'],
  },
  lastUpdated: {
    type: Date,
    nullable: false,
    canRead: [userOwns, 'admins'],
  },
};

export const ReadStatuses: ReadStatusesCollection = createCollection({
  collectionName: "ReadStatuses",
  typeName: "ReadStatus",
  schema,
  logChanges: false,
  resolvers: getDefaultResolvers('ReadStatuses'),
});

addUniversalFields({collection: ReadStatuses});

void ensureCustomPgIndex(`
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_ReadStatuses_userId_postId_tagId"
  ON public."ReadStatuses" USING btree
  (COALESCE("userId", ''::character varying), COALESCE("postId", ''::character varying), COALESCE("tagId", ''::character varying))
`);
ensureIndex(ReadStatuses, {userId:1, postId:1, isRead:1, lastUpdated:1})
ensureIndex(ReadStatuses, {userId:1, tagId:1, isRead:1, lastUpdated:1})

ReadStatuses.checkAccess = async (user, readStatus) => {
  return userIsAdmin(user) || userOwns(user, readStatus);
};

export default ReadStatuses;
