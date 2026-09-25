import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

declare global {
  /** One model call made while generating an issue, kept for the admin workbench. */
  interface AiDigestModelCallRecord {
    purpose: "post-selection" | "thread-selection";
    modelId: string;
    promptVersion: string;
    systemPrompt: string;
    prompt: string;
    inputTokenCount: number | null;
    outputTokenCount: number | null;
    uncachedInputTokenCount: number | null;
    cacheReadInputTokenCount: number | null;
    cacheWriteInputTokenCount: number | null;
    costUsd: number | null;
    toolCalls: Array<{ toolName: string; input: string }>;
  }
}

/**
 * How an AiDigestIssues row was generated: the prompts, token usage and cost of
 * each model call, and the total generation time. Read only by the admin
 * workbench, so it lives apart from the issue rows the product reads.
 */
const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  issueId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "AiDigestIssues",
      nullable: false,
    },
  },
  durationMs: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
  },
  calls: {
    database: {
      type: "JSONB",
      nullable: false,
      typescriptType: "AiDigestModelCallRecord[]",
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"AiDigestIssueGenerations">>;

export default schema;
