import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, schemaDefaultValue } from '../../collectionUtils'
import { foreignKeyField } from '../../utils/schemaUtils'
import { ensureIndex } from '../../collectionIndexUtils';

type ReferralType = "direct"|"recommendation"|"email"|"onsiteLink"|"offsiteLink";

const schema: SchemaType<DbUserPostEngagement> = {
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
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
  },
  referralType: {
    type: String,
  },
  referralRecommendation: {
    ...foreignKeyField({
      idFieldName: "recommendationLogId",
      resolverName: "recommendationLog",
      collectionName: "RecommendationLogs",
      type: "RecommendationLog",
      nullable: true,
    }),
  },
  
  readingTimeMS: {
    type: Number,
    ...schemaDefaultValue(0),
  },
  lastInteractedAt: {
    type: Date,
    onInsert: () => new Date(),
  },
};

export const UserPostEngagements: UserPostEngagementsCollection = createCollection({
  collectionName: 'UserPostEngagements',
  typeName: 'UserPostEngagement',
  schema,
});

addUniversalFields({collection: UserPostEngagements})

ensureIndex(UserPostEngagements, {postId:1, userId:1, clientId:1, _id:1});
ensureIndex(UserPostEngagements, {userId:1, postId:1, _id:1});
ensureIndex(UserPostEngagements, {userId:1, lastInteractedAt:-1, _id:1});
ensureIndex(UserPostEngagements, {clientId:1, postId:1, _id:1});

export default UserPostEngagements;
