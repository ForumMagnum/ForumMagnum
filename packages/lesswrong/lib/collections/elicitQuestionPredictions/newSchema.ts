import SimpleSchema from "simpl-schema";
import { generateIdResolverSingle } from "../../utils/schemaUtils";

const commonFields = (nullable: boolean) => ({
  hidden: true,
  canCreate: ["admins" as const],
  canRead: ["guests" as const],
  canUpdate: ["admins" as const],
  optional: nullable,
  nullable,
});

const creatorSchema = new SimpleSchema({
  _id: { type: String },
  displayName: { type: String },
  isQuestionCreator: { type: Boolean },
  sourceUserId: { type: String, nullable: true, optional: true },
});

const schema = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  predictionId: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: ({ _id }) => _id,
    },
  },
  prediction: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      inputType: "Date!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: () => new Date(),
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
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  creator: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      inputType: "JSON!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        simpleSchema: creatorSchema,
      },
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  sourceUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  sourceId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  binaryQuestionId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ElicitQuestions",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  question: {
    graphql: {
      outputType: "ElicitQuestion!",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "ElicitQuestions", fieldName: "binaryQuestionId" }),
    },
  },
  isDeleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"ElicitQuestionPredictions">>;

export default schema;
