import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  userId: {
    database: {
      type: "TEXT",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  deleted: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean!",
      canRead: ["guests"],
    },
  },
  documentId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  collectionName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  questionId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  question: {
    graphql: {
      outputType: "ElicitQuestion!",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "ElicitQuestions", fieldName: "questionId" }),
    },
  },
  quote: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"InlinePredictions">>;

export default schema;
