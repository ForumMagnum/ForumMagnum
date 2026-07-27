import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
  DEFAULT_LEGACY_DATA_FIELD,
  DEFAULT_SCHEMA_VERSION_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";
import { arrayOfForeignKeysOnCreate, generateIdResolverMulti, generateIdResolverSingle } from "@/lib/utils/schemaUtils";

const userIsIssueRecipient = (user: DbUser | null, issue: DbAiDigestIssue): boolean =>
  !!user && user._id === issue.recipientId;

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  recipientId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String!",
      canRead: ["admins"],
      canCreate: ["admins"],
    },
  },
  recipient: {
    graphql: {
      outputType: "User",
      canRead: ["admins"],
      resolver: generateIdResolverSingle({
        foreignCollectionName: "Users",
        fieldName: "recipientId",
      }),
    },
  },
  postIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]!",
      inputType: "[String!]!",
      canRead: [userIsIssueRecipient, "admins"],
      canCreate: ["admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  posts: {
    graphql: {
      outputType: "[Post!]!",
      canRead: [userIsIssueRecipient, "admins"],
      resolver: generateIdResolverMulti({
        foreignCollectionName: "Posts",
        fieldName: "postIds",
      }),
    },
  },
  quickTakeIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]!",
      inputType: "[String!]!",
      canRead: [userIsIssueRecipient, "admins"],
      canCreate: ["admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  quickTakes: {
    graphql: {
      outputType: "[Comment!]!",
      canRead: [userIsIssueRecipient, "admins"],
      resolver: generateIdResolverMulti({
        foreignCollectionName: "Comments",
        fieldName: "quickTakeIds",
      }),
    },
  },
  /** Anchor comment IDs of the issue's discussion-section threads. */
  discussionCommentIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]!",
      inputType: "[String!]!",
      canRead: [userIsIssueRecipient, "admins"],
      canCreate: ["admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  discussionComments: {
    graphql: {
      outputType: "[Comment!]!",
      canRead: [userIsIssueRecipient, "admins"],
      resolver: generateIdResolverMulti({
        foreignCollectionName: "Comments",
        fieldName: "discussionCommentIds",
      }),
    },
  },
  generatedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date!",
      inputType: "Date!",
      canRead: [userIsIssueRecipient, "admins"],
      canCreate: ["admins"],
    },
  },
  trigger: {
    database: {
      type: "TEXT",
      defaultValue: "adminSample",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: [userIsIssueRecipient, "admins"],
      canCreate: ["admins"],
      validation: {
        allowedValues: ["adminSample", "userPreview", "scheduled"],
        optional: true,
      },
    },
  },
  countsTowardHistory: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: [userIsIssueRecipient, "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  personalInstructions: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      inputType: "String",
      canRead: [userIsIssueRecipient, "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  selectionModelId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String!",
      canRead: ["admins"],
      canCreate: ["admins"],
    },
  },
  promptVersion: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String!",
      canRead: ["admins"],
      canCreate: ["admins"],
    },
  },
  selectionSystemPrompt: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },
  selectionUserPrompt: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },
  inputTokenCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  outputTokenCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  uncachedInputTokenCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  cacheReadInputTokenCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  cacheWriteInputTokenCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  selectionCostUsd: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"],
    },
  },
  toolCallCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  searchCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  readPostCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  threadPromptVersion: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },
  threadSelectionUserPrompt: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },
  threadInputTokenCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  threadOutputTokenCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  threadCacheReadInputTokenCount: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  threadSelectionCostUsd: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"],
    },
  },
  generationDurationMs: {
    database: {
      type: "INTEGER",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Int!",
      canRead: ["admins"],
    },
  },
  spec: {
    database: {
      type: "JSONB",
      nullable: true,
      typescriptType: "import(\"@/server/emailComponents/AiDigestSpec\").AiDigestSpec",
    },
    graphql: {
      outputType: "JSON",
      canRead: [userIsIssueRecipient, "admins"],
      canCreate: ["admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"AiDigestIssues">>;

export default schema;
