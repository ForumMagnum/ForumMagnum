// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userHasLlmChat } from "@/lib/betas";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users/permissions.ts";
import { markdownToHtml } from "@/server/editor/conversionUtils";
import { userVisibleMessageRoles } from "../llmMessages/schema";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
    },
  },
  model: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
    },
  },
  systemPrompt: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  lastUpdatedAt: {
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "admins"],
      resolver: async (document, args, context) => {
        const { LlmMessages } = context;
        const lastMessage = await LlmMessages.findOne(
          {
            conversationId: document._id,
          },
          {
            sort: {
              createdAt: -1,
            },
          }
        );
        return lastMessage?.createdAt ?? document.createdAt;
      },
      sqlResolver: ({ field }) => `(
        SELECT MAX(COALESCE(lm."createdAt", ${field("createdAt")}))
        FROM "LlmMessages" lm
        WHERE lm."conversationId" = ${field("_id")}
        GROUP BY lm."conversationId"
      )`,
    },
  },
  messages: {
    graphql: {
      outputType: "[LlmMessage]",
      canRead: [userOwns, "admins"],
      resolver: async (document, args, context) => {
        const { LlmMessages } = context;
        const selector = { conversationId: document._id, role: { $in: [...userVisibleMessageRoles] } };
        const messages = await LlmMessages.find(selector, { sort: { createdAt: 1 } }).fetch();
        const messagesHtml = await Promise.all(
          messages.map(async (message) => ({
            ...message,
            content: await markdownToHtml(message.content),
          }))
        );
        return messagesHtml;
      },
    },
  },
  deleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  totalCharacterCount: {
    graphql: {
      outputType: "Int",
      canRead: [userOwns, "admins"],
      resolver: async (document, args, context) => {
        const { LlmMessages } = context;
        const messages = await LlmMessages.find(
          {
            conversationId: document._id,
          },
          {
            projection: {
              content: 1,
            },
          }
        ).fetch();
        return messages.reduce((acc, message) => acc + message.content.length, 0);
      },
      sqlResolver: ({ field }) => `(
      SELECT SUM(LENGTH(lm."content"))
      FROM "LlmMessages" lm
      WHERE lm."conversationId" = ${field("_id")}
    )`,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"LlmConversations">>;

export default schema;
