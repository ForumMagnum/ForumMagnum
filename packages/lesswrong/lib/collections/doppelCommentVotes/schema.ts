import { foreignKeyField, schemaDefaultValue } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users";

const schema: SchemaType<"DoppelCommentVotes"> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      collectionName: "Users",
      resolverName: "user",
      type: "User",
      nullable: true,
    }),
    optional: false,
    canRead: [userOwns, "admins"],
    canCreate: ["members", "admins"],
    canUpdate: [userOwns, "admins"],
  },
  commentId: {
    ...foreignKeyField({
      idFieldName: "commentId",
      collectionName: "Comments",
      resolverName: "mimickedComment",
      type: "Comment",
      nullable: true,
    }),
    canRead: [userOwns, "guests"],
    canCreate: ["members", "admins"],
    canUpdate: [userOwns, "admins"],
  },
  type: {
    type: String,
    optional: false,
    nullable: false,
    allowedValues: ["vote", "skip"],
    canRead: [userOwns, "guests"],
    canCreate: ["members", "admins"],
    canUpdate: [userOwns, "admins"],
  },
  doppelCommentChoiceId: {
    ...foreignKeyField({
      idFieldName: "doppelCommentChoiceId",
      collectionName: "DoppelComments",
      resolverName: "doppelComment",
      type: "DoppelComment",
      nullable: true,
    }),
    optional: true,
    canRead: [userOwns, "guests"],
    canCreate: ["members", "admins"],
    canUpdate: [userOwns, "admins"],
  },
  deleted: {
    type: Boolean,
    optional: true,
    nullable: false,
    canRead: [userOwns, "guests"],
    canCreate: ["members", "admins"],
    canUpdate: [userOwns, "admins"],
    ...schemaDefaultValue(false),
  },
}

export default schema;
