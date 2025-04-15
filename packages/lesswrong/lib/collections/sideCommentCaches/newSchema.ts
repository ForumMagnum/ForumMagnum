import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";

// Deny all permissions on these objects - they're only used internally
const commonFields = () => ({
  // canRead: () => false,
  // canCreate: () => false,
  // canUpdate: () => false,
  hidden: true,
  // optional: false,
  nullable: false,
});

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [],
      forceIncludeInExecutableSchema: true,
    },
  },
  annotatedHtml: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [],
      forceIncludeInExecutableSchema: true,
    },
  },
  commentsByBlock: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      canRead: [],
      forceIncludeInExecutableSchema: true,
      validation: {
        blackbox: true,
      },
    },
  },
  version: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: [],
      forceIncludeInExecutableSchema: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"SideCommentCaches">>;

export default schema;
