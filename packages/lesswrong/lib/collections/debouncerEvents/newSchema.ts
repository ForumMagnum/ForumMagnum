// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

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
  af: {
    database: {
      type: "BOOL",
    },
  },
  dispatched: {
    database: {
      type: "BOOL",
      nullable: false,
    },
  },
  failed: {
    database: {
      type: "BOOL",
    },
  },
  delayTime: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  upperBoundTime: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  key: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  pendingEvents: {
    database: {
      type: "TEXT[]",
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"DebouncerEvents">>;

export default schema;
