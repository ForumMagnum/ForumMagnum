// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import {
    accessFilterSingle, arrayOfForeignKeysOnCreate, generateIdResolverMulti,
    getDenormalizedCountOfReferencesGetValue,
    getFillIfMissing
} from "../../utils/schemaUtils";
import * as _ from "underscore";
import { getWithCustomLoader } from "../../loaders";

const schema: Record<string, NewCollectionFieldSpecification<"Conversations">> = {
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
      canRead: ["members"],
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
  title: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["members"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
    form: {
      label: "Conversation title (visible to all)",
    },
  },
  participantIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "[String]",
      canRead: ["members"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
    form: {
      label: "Participants",
      control: "FormUserMultiselect",
    },
  },
  participants: {
    graphql: {
      type: "[User!]!",
      canRead: ["members"],
      resolver: generateIdResolverMulti({ collectionName: "Conversations", fieldName: "participantIds" }),
    },
    form: {
      hidden: true,
    },
  },
  latestActivity: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
    },
    graphql: {
      type: "Date",
      canRead: ["members"],
      onCreate: () => {
        return new Date(); // if this is an insert, set latestActivity to current timestamp
      },
    },
  },
  af: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  messageCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Conversations",
        fieldName: "messageCount",
        foreignCollectionName: "Messages",
        foreignFieldName: "conversationId",
        filterFn: (doc) => true,
      }),
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Messages",
        foreignFieldName: "conversationId",
        filterFn: (doc) => true,
        resyncElastic: false,
      },
    },
  },
  moderator: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      type: "Boolean",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
  },
  archivedByIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: getFillIfMissing([]),
      onUpdate: ({ data, currentUser, oldDocument }) => {
        if (data?.archivedByIds) {
          const changedIds = _.difference(oldDocument?.archivedByIds || [], data?.archivedByIds);
          changedIds.forEach((id) => {
            if (id !== currentUser._id) {
              throw new Error(
                `You can't archive or unarchive a conversation for another user. Attempted update: ${JSON.stringify(
                  data
                )}`
              );
            }
          });
        }
        return data.archivedByIds ?? [];
      },
    },
  },
  archivedBy: {
    graphql: {
      type: "[User!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Conversations", fieldName: "archivedByIds" }),
    },
    form: {
      hidden: true,
    },
  },
  latestMessage: {
    graphql: {
      type: "Message",
      canRead: ["members"],
      resolver: async (conversation, _args, context) => {
        const { currentUser } = context;
        const message = await getWithCustomLoader(
          context,
          "latestMessage",
          conversation._id,
          async (conversationIds) => {
            return await context.repos.conversations.getLatestMessages(conversationIds);
          }
        );
        const filteredMessage = await accessFilterSingle(currentUser, "Messages", message, context);
        return filteredMessage;
      },
      sqlResolver: ({ field, join }) =>
        join({
          table: "Messages",
          type: "left",
          on: {
            _id: `(
          SELECT "_id"
          FROM "Messages"
          WHERE "conversationId" = ${field("_id")}
          ORDER BY "createdAt" DESC
          LIMIT 1
        )`,
          },
          resolver: (messagesField) => messagesField("*"),
        }),
    },
  },
  hasUnreadMessages: {
    graphql: {
      type: "Boolean",
      canRead: ["members"],
      resolver: async (conversation, _args, context) => {
        const { currentUser } = context;
        if (!currentUser) {
          return false;
        }
        return getWithCustomLoader(context, "hasUnreadMessages", conversation._id, (conversationIds) =>
          context.repos.conversations.getReadStatuses(currentUser._id, conversationIds)
        );
      },
      sqlResolver: ({ field, currentUserField, join }) =>
        join({
          isNonCollectionJoin: true,
          table: "ConversationUnreadMessages",
          type: "left",
          on: {
            conversationId: field("_id"),
            userId: currentUserField("_id"),
          },
          resolver: (unreadMessagesField) => `COALESCE(${unreadMessagesField("hasUnreadMessages")}, FALSE)`,
        }),
    },
  },
};

export default schema;
