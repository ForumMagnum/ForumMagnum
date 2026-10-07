import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";
import { moderationProposalStatuses } from "./proposalSteps";

/**
 * ModerationProposals are action plans proposed by an LLM moderation agent
 * (or, potentially, written by hand): an ordered list of atomic moderation
 * actions targeting one user, queued for a moderator to review and apply in
 * the supermod UI. The server never executes proposals; the supermod client
 * applies each step through the existing moderation mutations and then
 * records the outcome here.
 */
const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  // The user the proposed moderation actions apply to
  targetUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  targetUser: {
    graphql: {
      outputType: "User",
      canRead: ["sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "targetUserId" }),
    },
  },
  // The moderator whose agent session produced this proposal
  createdByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  createdByUser: {
    graphql: {
      outputType: "User",
      canRead: ["sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "createdByUserId" }),
    },
  },
  conversationId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ModerationAgentConversations",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
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
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  // The agent's markdown explanation of why it proposes these actions
  rationale: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  // Array of ModerationProposalStep objects; see proposalSteps.ts for the
  // typed schema. Stored as untyped JSON at the GraphQL layer; both writers
  // and the applying client validate against the shared zod schema.
  steps: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      outputType: "[JSON!]",
      inputType: "[JSON!]!",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        blackbox: true,
      },
    },
  },
  status: {
    database: {
      type: "TEXT",
      defaultValue: "pending",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        allowedValues: [...moderationProposalStatuses],
        optional: true,
      },
    },
  },
  // Array of ModerationProposalStepResult objects, written by the client
  // after applying: [{index, status: "applied"|"skipped"|"failed", error?}]
  stepResults: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "[JSON!]",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      validation: {
        blackbox: true,
        optional: true,
      },
    },
  },
  appliedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  appliedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  // The model that produced this proposal, e.g. "anthropic/claude-sonnet-4-6"
  model: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ModerationProposals">>;

export default schema;
