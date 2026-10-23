import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";

declare global {
  type LlmRunStatus = "pending" | "running" | "completed" | "failed";
  /** Which feature invoked the model */
  type LlmRunInvocationContext = "commentReply";
}

export const LLM_RUN_STATUSES: LlmRunStatus[] = ["pending", "running", "completed", "failed"];
export const LLM_RUN_INVOCATION_CONTEXTS: LlmRunInvocationContext[] = ["commentReply"];

/**
 * One background run of a model, from any feature that runs models in the
 * background (see `invocationContext`). Everything here is public: run pages
 * show the system prompt, the context the model was given, and the full
 * transcript.
 */
const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  invocationContext: {
    database: {
      type: "TEXT",
      typescriptType: "LlmRunInvocationContext",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      validation: {
        allowedValues: LLM_RUN_INVOCATION_CONTEXTS,
      },
    },
  },
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  requesterUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  /** The version's name, e.g. "Opus5.5" */
  modelName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  gatewayModelId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  status: {
    database: {
      type: "TEXT",
      typescriptType: "LlmRunStatus",
      defaultValue: "pending",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      validation: {
        allowedValues: LLM_RUN_STATUSES,
      },
    },
  },
  systemPrompt: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  /** What the model was given up front */
  contextMessage: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  transcript: {
    database: {
      type: "JSONB",
      typescriptType: "LlmTranscriptEntry[]",
      defaultValue: [],
      nullable: false,
    },
    graphql: {
      outputType: "JSON!",
      canRead: ["guests"],
    },
  },
  /** The model's final response */
  response: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  error: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  attemptCount: {
    database: {
      type: "INTEGER",
      defaultValue: 0,
      nullable: false,
    },
  },
  /** When the current attempt claimed this run; used to detect attempts that died */
  claimedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
  },
  completedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
    },
  },

  // Comment replies only (invocationContext "commentReply")
  /** The comment that mentioned the model */
  triggerCommentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  /** The model's reply, created as a placeholder when the run is created */
  replyCommentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  /** The model family's account, which posts the reply */
  modelUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"LlmRuns">>;

export default schema;
