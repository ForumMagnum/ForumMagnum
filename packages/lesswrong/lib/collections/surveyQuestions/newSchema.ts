import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";

export const surveyQuestionFormats = {
  rank0To10: "Rank 0-10",
  text: "Text",
  multilineText: "Multiline text",
} as const;

export type SurveyQuestionFormat = keyof typeof surveyQuestionFormats;

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  surveyId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Surveys",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  survey: {
    graphql: {
      outputType: "Survey!",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Surveys", fieldName: "surveyId" }),
    },
  },
  question: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  format: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        allowedValues: ["rank0To10", "text", "multilineText"],
      },
    },
  },
  order: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"SurveyQuestions">>;

export default schema;
