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
      canRead: ["admins"],
    }
  },

  score:  {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
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
      outputType: "[SentenceScore]!",
      canRead: ["admins"],
    },

  },

} satisfies Record<string, CollectionFieldSpecification<"AutomatedContentEvaluations">>;

export default schema;
