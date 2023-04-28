import { foreignKeyField } from "../../utils/schemaUtils";
import SimpleSchema from "simpl-schema";

export const schema: SchemaType<DbPostRecommendation> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    optional: false,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: false,
    }),
    optional: false,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  strategyName: {
    type: String,
    optional: false,
    nullable: false,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  recommendationCount: {
    type: SimpleSchema.Integer,
    defaultValue: 0,
    optional: false,
    nullable: false,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  lastRecommendedAt: {
    type: Date,
    optional: false,
    nullable: false,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  clickedAt: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
};
