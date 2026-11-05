import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { accessFilterMultiple, accessFilterSingle } from "@/lib/utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  invocationContext: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      validation: {
        allowedValues: ["commentReply"],
      },
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: async (run, args, context) => {
        if (!run.triggerCommentId) {
          return null;
        }
        const triggerComment = await context.loaders.Comments.load(run.triggerCommentId);
        if (!triggerComment?.postId) {
          throw new Error(`Run ${run._id}'s trigger comment ${run.triggerCommentId} isn't on a post`);
        }
        const post = await context.loaders.Posts.load(triggerComment.postId);
        return await accessFilterSingle(context.currentUser, "Posts", post, context);
      },
    },
  },
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
      defaultValue: "pending",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      validation: {
        allowedValues: ["pending", "running", "completed", "failed"],
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
  transcriptEntries: {
    graphql: {
      outputType: "[LlmRunTranscriptEntry!]!",
      canRead: ["guests"],
      resolver: async (run, args, context) => {
        // Publication-only retries reuse the answer and transcript from the last generation.
        const latestEntry = await context.LlmRunTranscriptEntries.findOne(
          { llmRunId: run._id },
          { sort: { attempt: -1 } },
        );
        if (!latestEntry) return [];
        const entries = await context.LlmRunTranscriptEntries.find(
          { llmRunId: run._id, attempt: latestEntry.attempt },
          { sort: { index: 1 } },
        ).fetch();
        return await accessFilterMultiple(context.currentUser, "LlmRunTranscriptEntries", entries, context);
      },
    },
  },
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
      canRead: ["admins"],
    },
  },
  attemptCount: {
    database: {
      type: "INTEGER",
      defaultValue: 0,
      nullable: false,
    },
  },
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
  replyCommentId: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: async (run, args, context) => {
        const replyComment = await context.Comments.findOne({ llmRunId: run._id });
        const accessibleReply = await accessFilterSingle(context.currentUser, "Comments", replyComment, context);
        return accessibleReply?._id ?? null;
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"LlmRuns">>;

export default schema;
