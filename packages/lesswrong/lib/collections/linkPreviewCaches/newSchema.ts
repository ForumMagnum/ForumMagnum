import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  url: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  cacheVersion: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
  },
  status: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  requestStartedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  fetchedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
  },
  nextRefreshAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  imageUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  originalImageUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  mirroredImageUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  imageWidth: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
  },
  imageHeight: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
  },
  sanitizedHtml: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  error: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  remoteHtml: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  debugTitleSource: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  debugImageSource: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  debugHtmlSource: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"LinkPreviewCaches">>;

export default schema;
