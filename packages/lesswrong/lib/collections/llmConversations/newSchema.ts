// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { userHasLlmChat } from "@/lib/betas";
import { generateIdResolverSingle, getFillIfMissing, throwIfSetToNull } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users/permissions.ts";
import { markdownToHtml } from "@/server/editor/conversionUtils";
import { userVisibleMessageRoles } from "../llmMessages/schema";

const schema: Record<string, NewCollectionFieldSpecification<"LlmConversations">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ collectionName: "LlmConversations", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "String",
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
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
    },
  },
  lastUpdatedAt: {
    graphql: {
      type: "Date",
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
      sqlResolver: ({ field, join }) => `(
      SELECT MAX(COALESCE(lm."createdAt", ${field("createdAt")}))
      FROM "LlmMessages" lm
      WHERE lm."conversationId" = ${field("_id")}
      GROUP BY lm."conversationId"
    )`,
    },
  },
  messages: {
    graphql: {
      type: "[LlmMessage]",
      canRead: [userOwns, "admins"],
      resolver: async (document, args, context) => {
        const { LlmMessages } = context;
        const messages = await LlmMessages.find(
          {
            conversationId: document._id,
            role: {
              $in: [...userVisibleMessageRoles],
            },
          },
          {
            sort: {
              createdAt: 1,
            },
          }
        ).fetch();
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
      type: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  totalCharacterCount: {
    graphql: {
      type: "Int",
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
};

export default schema;
