import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import SimpleSchema from "simpl-schema";

const RenderResultSchemaType = new SimpleSchema({
  ssrBody: {
    type: String,
  },
  headers: {
    type: Array,
  },
  "headers.$": {
    type: String,
  },
  serializedApolloState: {
    type: String,
  },
  serializedForeignApolloState: {
    type: String,
  },
  jssSheets: {
    type: String,
  },
  status: {
    type: Number,
    optional: true,
  },
  redirectUrl: {
    type: String,
    optional: true,
  },
  relevantAbTestGroups: {
    type: Object,
    blackbox: true,
  },
  allAbTestGroups: {
    type: Object,
    blackbox: true,
  },
  themeOptions: {
    type: Object,
    blackbox: true,
  },
  renderedAt: {
    type: Date,
  },
  cacheFriendly: {
    type: Boolean,
  },
  timezone: {
    type: String,
  },
  timings: {
    type: Object,
    blackbox: true,
  },
});

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  path: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  // This is always a Record<string, string>
  abTestGroups: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [],
      validation: {
        blackbox: true,
      }
    }
  },
  bundleHash: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  renderedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  expiresAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  // This can be inferred from renderedAt and expiresAt, but it's useful to have for debugging
  ttlMs: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
  },
  renderResult: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    // This isn't accessible via the API, but it's here to for the type codegen output
    // If/when we tear out SimpleSchema, we can get rid of this
    graphql: {
      outputType: "JSON",
      canRead: [],
      validation: {
        simpleSchema: RenderResultSchemaType,
      }
    }
  },
} satisfies Record<string, CollectionFieldSpecification<"PageCache">>;

export default schema;
