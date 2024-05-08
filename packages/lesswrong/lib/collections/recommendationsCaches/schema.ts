import { userOwns } from "../../vulcan-users/permissions";

const schema: SchemaType<"RecommendationsCaches"> = {
  userId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["members"],
    canUpdate: ["admins"],
  },
  postId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["members"],
    canUpdate: ["admins"],
  },
  source: {
    type: String,
    allowedValues: ["recombee", "vertex"],
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["members"],
    canUpdate: ["admins"],
  },
  scenario: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["members"],
    canUpdate: ["admins"],
  },
  attributionId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["members"],
    canUpdate: ["admins"],
  },
  ttlMs: {
    type: Number,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["members"],
    canUpdate: ["admins"],
  },
};

export default schema;
