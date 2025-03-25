import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { arrayOfForeignKeysOnCreate, generateIdResolverMulti } from "../../utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: {
    database: DEFAULT_CREATED_AT_FIELD.database,
    graphql: {
      ...DEFAULT_CREATED_AT_FIELD.graphql,
      canRead: ["admins"],
    },
  },
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  clientId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
  firstSeenReferrer: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
  firstSeenLandingPage: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
  userIds: {
    database: {
      type: "TEXT[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: true,
    },
    graphql: {
      outputType: "[String]",
      inputType: "[String]!",
      canRead: ["sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  users: {
    graphql: {
      outputType: "[User!]!",
      canRead: ["sunshineRegiment", "admins"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "userIds" }),
    },
  },
  invalidated: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  lastSeenAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  timesSeen: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"ClientIds">>;

export default schema;
