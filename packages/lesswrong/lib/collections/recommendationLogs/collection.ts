import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, schemaDefaultValue } from '../../collectionUtils'
import { foreignKeyField } from '../../utils/schemaUtils'
import { ensureIndex } from '../../collectionIndexUtils';

const schema: SchemaType<DbRecommendationLog> = {
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    canRead: ['guests'],
    canCreate: ['members'],
  },
  clientId: {
    type: String,
    nullable: true,
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    canRead: ['guests'],
    canCreate: ['members'],
  },
  seen: {
    type: Boolean,
    ...schemaDefaultValue(false),
  },
  recommendationType: {
    type: String,
  },
};

export const RecommendationLogs: RecommendationLogsCollection = createCollection({
  collectionName: 'RecommendationLogs',
  typeName: 'RecommendationLog',
  schema,
});

addUniversalFields({collection: RecommendationLogs})

ensureIndex(RecommendationLogs, {postId:1, userId:1, clientId:1, _id:1});
ensureIndex(RecommendationLogs, {userId:1, postId:1, _id:1});
ensureIndex(RecommendationLogs, {clientId:1, postId:1, _id:1});

export default RecommendationLogs;
