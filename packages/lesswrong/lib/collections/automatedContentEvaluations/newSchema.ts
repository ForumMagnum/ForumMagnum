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
      outputType: "String!",
      canRead: ["guests"],
    }
  },

  score: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"], 
    }
  },

  sentenceScores: {
    database: {
      type: "JSONB",
      nullable: true,
      typescriptType: "{ sentence: string; score: number; }[]",
    },
    graphql: {
      outputType: "[SentenceScore!]",
      canRead: ["guests"],
    },
  },

  aiChoice: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        allowedValues: ["accept", "review"],
      },
    },
  },

  aiReasoning: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },

  aiCoT: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"AutomatedContentEvaluations">>;

export default schema;
