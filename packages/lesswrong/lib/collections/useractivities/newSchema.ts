import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  visitorId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    // This is here purely for the type codegen output;
    // if/when we get rid of SimpleSchema, we can get rid of this
    graphql: {
      outputType: "String",
      canRead: [],
      validation: {
        allowedValues: ["userId", "clientId"],
      }
    }
  },
  startDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  endDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  activityArray: {
    database: {
      // In practice this is currently a boolean, but we could support weighting by how long exactly they were active for
      type: "DOUBLE PRECISION[]",
      nullable: false,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"UserActivities">>;

export default schema;
