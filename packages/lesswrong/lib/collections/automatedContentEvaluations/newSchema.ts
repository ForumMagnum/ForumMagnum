import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  revisionId: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
      foreignKey: "Revisions",
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    }
  },

  score: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"], 
    }
  },

  sentenceScores: {
    database: {
      type: "JSONB",
      nullable: false,
      typescriptType: "{ sentence: string; score: number; }[]",
    },
    graphql: {
      outputType: "[SentenceScore]",
      canRead: ["admins"],
    },
  },

  aiChoice: {
    database: {
      type: "VARCHAR(255)",
      nullable: false,
      typescriptType: '"accept" | "review"',
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  aiReasoning: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  aiCoT: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"AutomatedContentEvaluations">>;

export default schema;
