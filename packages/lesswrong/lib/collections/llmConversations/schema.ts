import { resolverOnlyField, schemaDefaultValue } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users";
import SimpleSchema from "simpl-schema";

const systemPromptType = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['text'],
    nullable: false,
  },
  text: {
    type: String,
    nullable: false,
  },
  cache_control: {
    type: Object,
    optional: true,
    nullable: true,
  }
})

const schema: SchemaType<"LlmConversations"> = {
  userId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  title: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  model: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  systemPrompt: {
    type: String,
    optional: true,
    nullable: true,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  // 'systemPrompt.$': {
  //   type: systemPromptType
  // },
  lastUpdatedAt: resolverOnlyField({
    type: Date,
    nullable: false,
    canRead: [userOwns, "admins"],
    resolver: async (document, args, context) => {
      const { LlmMessages } = context;
      const lastMessage = await LlmMessages.findOne({conversationId: document._id}, {sort: {createdAt: -1}});
      return lastMessage?.createdAt ?? document.createdAt;
    },
    sqlResolver: ({field, join}) => `(
      SELECT MAX(COALESCE(${field("createdAt")}, lm."createdAt"))
      FROM "LlmMessages" lm
      WHERE lm."conversationId" = ${field("_id")}
      GROUP BY lm."conversationId"
    )`
  }),
  messages: {
    type: Array,
    optional: true,
    canRead: [userOwns, 'admins'],
  },
  'messages.$': {
    type: Object,
    foreignKey: "LlmMessages"
  },
  deleted: {
    type: Boolean,
    optional: true,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: [userOwns, "admins"], 
    ...schemaDefaultValue(false),
  }
}

export default schema;