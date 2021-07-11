import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, ensureIndex, ensurePgIndex } from '../../collectionUtils'
import { foreignKeyField } from '../../utils/schemaUtils'

const schema: SchemaType<DbReadStatus> = {
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
  },
  isRead: {
    type: Boolean,
  },
  lastUpdated: {
    type: Date,
  },
};

export const ReadStatuses: ReadStatusesCollection = createCollection({
  collectionName: "ReadStatuses",
  typeName: "ReadStatus",
  schema
});

addUniversalFields({collection: ReadStatuses});

ensureIndex(ReadStatuses, {userId:1, postId:1, tagId:1}, {unique: true})
ensureIndex(ReadStatuses, {userId:1, postId:1, isRead:1, lastUpdated:1})
ensureIndex(ReadStatuses, {userId:1, tagId:1, isRead:1, lastUpdated:1})

 
ensurePgIndex(ReadStatuses, "user_post", "USING BTREE ((json->>'userId'), (json->>'postId'), (json->>'pastUpdated'), (json->>'lastUpdated'))");
ensurePgIndex(ReadStatuses, "user_tag", "USING BTREE ((json->>'userId'), (json->>'tagId'), (json->>'pastUpdated'), (json->>'lastUpdated'))");

export default ReadStatuses;
