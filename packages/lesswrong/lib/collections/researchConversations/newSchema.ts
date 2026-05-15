import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";

// Shape stored in the `entrypoint` JSONB column. Sub-agent / fork variants
// aren't produced by any user-driven mutation today; they're carried in the
// union so server-internal spawns (when we add them) and the sidebar's
// kind-bucketing display can share one type.
interface ChatEntrypoint {
  kind: 'chat';
  activeDocumentId: string;
}
interface DocumentEntrypoint {
  kind: 'document';
  documentId: string;
}
interface SubagentEntrypoint {
  kind: 'subagent';
  parentConversationId: string;
}
interface ForkEntrypoint {
  kind: 'fork';
  parentConversationId: string;
  forkedAtSeq: number;
}
export type Entrypoint = ChatEntrypoint | DocumentEntrypoint | SubagentEntrypoint | ForkEntrypoint;
export type EntrypointKind = Entrypoint['kind'];

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
  // `Entrypoint` discriminated union above. Stored as JSONB so new entrypoint
  // kinds can ship without migrations.
  entrypoint: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      inputType: "JSON!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: { blackbox: true },
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
