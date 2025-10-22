import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { getWithLoader } from "@/lib/loaders";
import ElicitQuestionPredictions from "@/server/collections/elicitQuestionPredictions/collection";

const commonFields = (nullable: boolean) => ({
  hidden: true,
  required: false,
  canCreate: ["members" as const, "sunshineRegiment" as const],
  canRead: ["guests" as const],
  canUpdate: ["admins" as const],
  optional: nullable,
  nullable,
});

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "sunshineRegiment"],
    },
  },
  notes: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  resolution: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  resolvesBy: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  
  currentUserPrediction: {
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      resolver: async (question, args, context) => {
        const { currentUser } = context;
        if (!currentUser) return null;
        const predictions = await getWithLoader(context, ElicitQuestionPredictions,
          `predictionsByUser${currentUser._id}`,
          {
            userId: currentUser._id,
            isDeleted: false,
          },
          "binaryQuestionId", question._id
        );
        if (predictions.length !== 1) {
          return null;
        }
        return predictions[0].prediction
      },
    },
  },

  distribution: {
    graphql: {
      outputType: "[Int!]!",
      canRead: ["guests"],
      resolver: async (question, args, context) => {
        const { getPredictionDistribution } = require("@/server/resolvers/elicitPredictions");
        return await getPredictionDistribution(question._id, 10, context);
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ElicitQuestions">>;

export default schema;
