import { createCollection } from 'vulcan:core';
import { addUniversalFields } from '../../collectionUtils'
import { foreignKeyField } from '../../modules/utils/schemaUtils'
import { ensureIndex } from '../../collectionUtils';

const schema = {
  _id: {
    type: String,
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
    }),
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
  },
  isRead: {
    type: Boolean,
  },
  lastUpdated: {
    type: Date,
  },
};

export const ReadStatuses = createCollection({
  collectionName: "ReadStatuses",
  typeName: "ReadStatus",
  schema
});

addUniversalFields({collection: ReadStatuses});

ensureIndex(ReadStatuses, {userId:1, postId:1, isRead:1, lastUpdated:1})

export default ReadStatuses;