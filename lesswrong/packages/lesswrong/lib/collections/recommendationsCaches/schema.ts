import { userOwns } from "../../vulcan-users/permissions";

const schema: SchemaType<"RecommendationsCaches"> = {
  // NOTE: this "userId" is the recombee user id, which is our userId for logged-in users and clientId for logged out users
  // Do not use it as a foreign key for Users
  userId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  postId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  source: {
    type: String,
    allowedValues: ["recombee", "vertex"],
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  scenario: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  attributionId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  ttlMs: {
    type: Number,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
};

export default schema;
