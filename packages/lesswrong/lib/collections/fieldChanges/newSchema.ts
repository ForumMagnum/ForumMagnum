import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["members"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  changeGroup: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
    },
  },
  documentId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
    },
  },
  fieldName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
    },
  },

  // While these are both JSON values, they can also contain primitives like strings, numbers, booleans, nulls, etc.
  // They should still get deserialized correctly (except for dates, which get serialized and deserialized as strings).
  oldValue: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      inputType: "JSON!",
      canRead: ["members"],
      validation: {
        blackbox: true,
      },
    },
  },
  newValue: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      inputType: "JSON!",
      canRead: ["members"],
      validation: {
        blackbox: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"FieldChanges">>;

export default schema;
