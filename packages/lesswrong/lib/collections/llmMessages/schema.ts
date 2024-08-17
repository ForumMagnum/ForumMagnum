import { userOwns } from "@/lib/vulcan-users";

const schema: SchemaType<"LlmMessages"> = {
  userId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  conversationId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  role: {
    type: String,
    optional: false,
    nullable: false,
    allowedValues: ["user", "assistant"],
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  type: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  content: {
    type: Object,
    optional: true,
    nullable: true,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
}

export default schema;