import { userHasLlmChat } from "@/lib/betas";
import { foreignKeyField, resolverOnlyField, schemaDefaultValue } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users";

const schema: SchemaType<"LlmConversations"> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: [userHasLlmChat, "admins"],
    canUpdate: ["admins"],
  },
  title: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: [userHasLlmChat, "admins"],
    canUpdate: ["admins"],
  },
  model: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: [userHasLlmChat, "admins"],
    canUpdate: ["admins"],
  },
  systemPrompt: {
    type: String,
    optional: true,
    nullable: true,
    canRead: [userOwns, "admins"],
    canCreate: [userHasLlmChat, "admins"],
    canUpdate: ["admins"],
  },
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
      SELECT MAX(COALESCE(lm."createdAt", ${field("createdAt")}))
      FROM "LlmMessages" lm
      WHERE lm."conversationId" = ${field("_id")}
      GROUP BY lm."conversationId"
    )`
  }),
  // This is a resolver-only field; logic defined in llmConversationsResolvers.ts
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
  },
}

export default schema;
