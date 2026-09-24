import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverMulti, generateIdResolverSingle } from "@/lib/utils/schemaUtils";

const userIsIssueRecipient = (user: DbUser | null, issue: DbAiDigestIssue): boolean =>
  !!user && user._id === issue.recipientId;

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  recipientId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
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
      outputType: "[String!]",
      canRead: [userIsIssueRecipient, "admins"],
    },
  },
  posts: {
    graphql: {
      outputType: "[Post!]",
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
      outputType: "[String!]",
      canRead: [userIsIssueRecipient, "admins"],
    },
  },
  quickTakes: {
    graphql: {
      outputType: "[Comment!]",
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
      outputType: "[String!]",
      canRead: [userIsIssueRecipient, "admins"],
    },
  },
  discussionComments: {
    graphql: {
      outputType: "[Comment!]",
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
      outputType: "Date",
      canRead: [userIsIssueRecipient, "admins"],
    },
  },
  /** When the issue was successfully emailed; null for issues never sent. */
  emailedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["admins"],
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
      outputType: "AiDigestIssueTrigger",
      canRead: [userIsIssueRecipient, "admins"],
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
      outputType: "Boolean",
      canRead: [userIsIssueRecipient, "admins"],
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
      canRead: [userIsIssueRecipient, "admins"],
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
      outputType: "String",
      canRead: ["admins"],
    },
  },
  promptVersion: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
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
  generationDurationMs: {
    database: {
      type: "INTEGER",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
    },
  },
  spec: {
    database: {
      type: "JSONB",
      nullable: false,
      typescriptType: "import(\"@/lib/aiDigest/aiDigestSpec\").AiDigestSpec",
    },
    graphql: {
      outputType: "JSON",
      canRead: [userIsIssueRecipient, "admins"],
    },
  },
  /** The issue's subject line, lifted out of the spec so lists needn't load it. */
  subject: {
    graphql: {
      outputType: "String",
      canRead: [userIsIssueRecipient, "admins"],
      resolver: (issue) => issue.spec.subject,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"AiDigestIssues">>;

export default schema;
