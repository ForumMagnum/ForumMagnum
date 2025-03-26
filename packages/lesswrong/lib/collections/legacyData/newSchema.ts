import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  objectId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  collectionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"LegacyData">>;

export default schema;
