import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

declare global {
  type LlmTranscriptEntryType = "reasoning" | "text" | "toolCall" | "toolResult" | "toolError" | "source" | "resultLink";
}

const LLM_TRANSCRIPT_ENTRY_TYPES: LlmTranscriptEntryType[] = ["reasoning", "text", "toolCall", "toolResult", "toolError", "source", "resultLink"];

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  llmRunId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "LlmRuns",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  attempt: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
    },
  },
  index: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
    },
  },
  type: {
    database: {
      type: "TEXT",
      typescriptType: "LlmTranscriptEntryType",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      validation: {
        allowedValues: LLM_TRANSCRIPT_ENTRY_TYPES,
      },
    },
  },
  text: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  toolCallId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  toolName: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  query: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  url: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  extra: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"LlmRunTranscriptEntries">>;

export default schema;
