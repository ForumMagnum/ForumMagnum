import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import {
  accessFilterSingle, arrayOfForeignKeysOnCreate, generateIdResolverMulti,
  getDenormalizedCountOfReferencesGetValue
} from "../../utils/schemaUtils";
import * as _ from "underscore";
import { getWithCustomLoader } from "../../loaders";
import { isFriendlyUI } from "@/themes/forumTheme";
import { isLWorAF } from "@/lib/instanceSettings";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: {
    database: DEFAULT_CREATED_AT_FIELD.database,
    graphql: {
      ...DEFAULT_CREATED_AT_FIELD.graphql,
      canRead: ["members"],
    },
  },
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  title: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["members"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: isFriendlyUI ? "Conversation title (visible to all)" : "Conversation Title",
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
      outputType: "[String]",
      canRead: ["members"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Participants",
      control: "FormUserMultiselect",
    },
  },
  participants: {
    graphql: {
      outputType: "[User!]!",
      canRead: ["members"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "participantIds" }),
    },
  },
  latestActivity: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["members"],
      onCreate: () => {
        return new Date(); // if this is an insert, set latestActivity to current timestamp
      },
      validation: {
        optional: true,
      },
    },
  },
  af: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: !isLWorAF,
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
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Messages",
        foreignFieldName: "conversationId",
        filterFn: (doc) => true,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  moderator: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins", "sunshineRegiment"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {},
  },
  archivedByIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      // Allow users to only update their own archived status, this has some potential concurrency problems,
      // but I don't expect this to ever come up, and it fails relatively gracefully in case one does occur
      onUpdate: ({ data, currentUser, oldDocument }) => {
        if (data?.archivedByIds) {
          const changedIds = _.difference(oldDocument?.archivedByIds || [], data?.archivedByIds);
          changedIds.forEach((id) => {
            if (id !== currentUser?._id) {
              throw new Error(`You can't archive or unarchive a conversation for another user. Attempted update: ${JSON.stringify(data)}`);
            }
          });
        }
        return data.archivedByIds ?? [];
      },
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  archivedBy: {
    graphql: {
      outputType: "[User!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "archivedByIds" }),
    },
  },
  latestMessage: {
    graphql: {
      outputType: "Message",
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
      outputType: "Boolean",
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
} satisfies Record<string, NewCollectionFieldSpecification<"Conversations">>;

export default schema;
