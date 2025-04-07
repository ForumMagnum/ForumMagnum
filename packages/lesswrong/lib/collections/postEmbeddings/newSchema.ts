import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";

export const EMBEDDINGS_VECTOR_SIZE = 1536;

const commonFields = (nullable = false) => ({
  canRead: ["admins" as const],
  canCreate: ["admins" as const],
  canUpdate: ["admins" as const],
  hidden: true,
  optional: nullable,
  nullable,
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
      inputType: "String!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  postHash: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  lastGeneratedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      inputType: "Date!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  model: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  embeddings: {
    database: {
      type: "VECTOR(1536)",
      nullable: false,
    },
    graphql: {
      outputType: "[Float]",
      inputType: "[Float]!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"PostEmbeddings">>;

export default schema;
