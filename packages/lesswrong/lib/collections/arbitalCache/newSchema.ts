import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  pageAlias: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  fetchedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  sanitizedHtml: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ArbitalCaches">>;

export default schema;
