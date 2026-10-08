import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";
import { moderationProposalStatuses } from "./proposalSteps";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
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
