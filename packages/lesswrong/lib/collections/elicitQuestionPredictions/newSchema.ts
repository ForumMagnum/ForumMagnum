// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import SimpleSchema from "simpl-schema";
import { generateIdResolverSingle, getFillIfMissing, throwIfSetToNull } from "../../utils/schemaUtils";

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

const schema: Record<string, NewCollectionFieldSpecification<"ElicitQuestionPredictions">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  predictionId: {
    graphql: {
      type: "String",
      resolver: ({ _id }) => _id,
    },
  },
  prediction: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: ({ document: prediction }) => prediction.createdAt ?? new Date(),
    },
  },
  notes: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  creator: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        simpleSchema: FILL_THIS_IN,
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
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        collectionName: "ElicitQuestionPredictions",
        fieldName: "userId",
        nullable: true,
      }),
    },
    form: {
      hidden: true,
    },
  },
  sourceUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  sourceId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  binaryQuestionId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ElicitQuestions",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  question: {
    graphql: {
      type: "ElicitQuestion!",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        collectionName: "ElicitQuestionPredictions",
        fieldName: "binaryQuestionId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
};

export default schema;
