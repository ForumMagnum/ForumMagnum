import { resolverOnlyField } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users";

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
    type: Object,
    optional: true,
    nullable: true,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
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
    sqlResolver: ({field, join}) => join({
      table: "LlmMessages",
      type: "left",
      on: {
        conversationId: field("_id")
      },
      resolver: (messagesField) => `COALESCE(MAX(${messagesField("createdAt")}), ${field("createdAt")})`
    })
  }),
  messages: resolverOnlyField({
    type: Array,
    graphQLtype: "[LlmMessage]",
    canRead: [userOwns, "admins"],
    resolver: async (document, args, context) => {
      const { LlmMessages } = context;
      return LlmMessages.find({conversationId: document._id});
    },
    sqlResolver: ({field, join}) => join({
      table: "LlmMessages",
      type: "left",
      on: {
        conversationId: field("_id")
      },
      resolver: (messagesField) => messagesField("*")
    })
  }),
  'messages.$': {
    type: Object,
    foreignKey: "LlmMessages",
  },
}

export default schema;