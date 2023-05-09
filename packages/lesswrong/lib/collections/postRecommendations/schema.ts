import { foreignKeyField } from "../../utils/schemaUtils";
import SimpleSchema from "simpl-schema";

export const schema: SchemaType<DbPostRecommendation> = {
  /** The user who the recommendation was generated for. */
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    optional: true,
    nullable: true,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  /**
   * The client id of logged out users - this is null when user id is set.
   */
  clientId: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  /** The post used as a seed for this recommendation. */
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: false,
    }),
    optional: false,
    nullable: false,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  /**
   * The strategy used to generate this recommendation.
   * See server/recommendations/Strategy.ts.
   */
  strategyName: {
    type: String,
    optional: false,
    nullable: false,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  /**
   * The settings fed into the above strategy to generate the recommendation.
   */
  strategySettings: {
    type: Object,
    optional: true,
    nullable: true,
    blackbox: true,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  /**
   * The number of times this recommendation has been _viewed_ by the user. This starts
   * at 0 when the recommendation is generated and is incremeted each time the
   * recommendation enters the users viewport.
   */
  recommendationCount: {
    type: SimpleSchema.Integer,
    defaultValue: 0,
    optional: false,
    nullable: false,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  /** The date of the last time this recommendation was generated. */
  lastRecommendedAt: {
    type: Date,
    optional: false,
    nullable: false,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
  /** The date of the last time this recommendation was clicked. */
  clickedAt: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
};
