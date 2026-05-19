import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";

/** How a conversation was started: from the chat pane, or a document's agent block. */
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
  // Claude Code's session UUID, used with `claude --resume`. May lag
  // creation by a turn — populated once the first sandbox dispatch reports
  // back its session id.
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
  // `chat` — started from the chat pane; `document` — an agent block embedded
  // in a research document. (See the `EntrypointKind` type above.)
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
  // The active document at chat creation, or the document the conversation's
  // agent block lives in.
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
  // The workspace repo a coding conversation runs against. Null for ordinary
  // (non-coding) research conversations, which have no repo.
  workspaceRepoId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "WorkspaceRepos",
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
  // Denormalized for sidebar sort; written per turn.
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
} satisfies Record<string, CollectionFieldSpecification<"ResearchConversations">>;

export default schema;
