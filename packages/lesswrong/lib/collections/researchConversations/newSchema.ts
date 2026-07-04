import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";

export type EntrypointKind = 'chat' | 'document';

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
  projectId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ResearchProjects",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  // Populated after the first sandbox dispatch, not at conversation creation.
  claudeSessionId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
  // Custom sidebar icon in place of the default chat glyph: `svg:<id>`
  // referencing the hand-drawn set in researchIconSet.tsx, or a bare Unicode
  // emoji (legacy values from the retired emoji picker still render).
  icon: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: { optional: true },
    },
  },
  entrypointKind: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "ResearchEntrypointKind",
      inputType: "ResearchEntrypointKind!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  entrypointDocumentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ResearchDocuments",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  baseEnvironmentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ResearchEnvironments",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      inputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
  runtime: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      inputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
  // Agent-authored HTML shown as the conversation block's collapsed
  // ("presentation") body in documents. Set via the agent backend endpoint
  // (set-presentation), not by users; when null the client falls back to a
  // truncated render of the last assistant message.
  presentationHtml: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      validation: { optional: true },
    },
  },
  // Total user turns across the whole conversation. Resolver-only: the client
  // can't derive this from its windowed event stream (older history isn't
  // loaded), which is exactly the bug this replaces.
  userTurnCount: {
    graphql: {
      outputType: "Int",
      canRead: [userOwns, "admins"],
      resolver: async (conversation, _args, context) => {
        return await context.ResearchConversationEvents.find({
          conversationId: conversation._id,
          kind: "user",
        }).count();
      },
    },
  },
  // Denormalized for sidebar sort.
  lastActivityAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
  /**
   * When the owner last opened/viewed this conversation. Drives the sidebar's
   * unread indicator: activity after this timestamp (with no turn in flight)
   * shows as "completed, not yet looked at". Null = never explicitly opened
   * since the field shipped; treated as read so old conversations don't all
   * light up. Written only by `markResearchConversationRead`, which stamps
   * the server clock — a client-supplied stamp could sit behind the
   * server-written `lastActivityAt` and never clear the indicator.
   */
  lastReadAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "admins"],
      validation: { optional: true },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ResearchConversations">>;

export default schema;
