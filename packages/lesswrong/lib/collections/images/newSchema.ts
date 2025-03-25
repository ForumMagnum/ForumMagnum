import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  /** @deprecated Use identifier + identifierType = 'originalUrl' */
  originalUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  identifier: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  identifierType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [],
      validation: {
        allowedValues: ['sha256Hash', 'originalUrl'],
      }
    }
  },
  cdnHostedUrl: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Images">>;

export default schema;
