import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
  DEFAULT_LEGACY_DATA_FIELD,
  DEFAULT_SCHEMA_VERSION_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  commentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
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
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  count: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
}

export default schema
