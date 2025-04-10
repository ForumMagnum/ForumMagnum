import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

// The databaseMetadata collection is a collection of named, mostly-singleton
// values. (Currently just databaseId, which is used for ensuring you don't
// connect to a production database without using the corresponding config
// file.)

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  name: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  value: {
    database: {
      type: "JSONB",
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"DatabaseMetadata">>;

export default schema;
