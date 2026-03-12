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

  // score & sentenceScores are Sapling fields
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

  // aiChoice, aiReasoning, and aiCoT are the results of calling an LLM for a qualitative judgment based on specified criteria
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

  // Pangram AI detection fields
  pangramScore: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["sunshineRegiment", "admins"],
    },
  },

  pangramMaxScore: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["sunshineRegiment", "admins"],
    },
  },

  pangramPrediction: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
      validation: {
        allowedValues: ["AI", "Human", "Mixed"],
      },
    },
  },

  pangramWindowScores: {
    database: {
      type: "JSONB",
      nullable: true,
      typescriptType: "{ text: string; score: number; startIndex: number; endIndex: number; }[]",
    },
    graphql: {
      outputType: "[PangramWindowScore!]",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"AutomatedContentEvaluations">>;

export default schema;
