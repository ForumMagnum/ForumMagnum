import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

declare global {
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
