// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../../lib/utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  token: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  tokenType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
  },
  user: {
    graphql: {
      outputType: "User!",
      canRead: [],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  usedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
  },
  params: {
    database: {
      type: "JSONB",
    },
    // This isn't accessible via the API, but it's here to reduce diffs in codegen outputs because `blackbox` affects that
    // Can get rid of it later if we want to
    graphql: {
      outputType: "JSON",
      canRead: [],
      validation: {
        blackbox: true,
      }
    }
  },
} satisfies Record<string, NewCollectionFieldSpecification<"EmailTokens">>;

export default schema;
