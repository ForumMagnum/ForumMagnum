import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
  DEFAULT_LEGACY_DATA_FIELD,
  DEFAULT_SCHEMA_VERSION_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";

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
      canCreate: ["admins"],
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["admins"],
      resolver: generateIdResolverSingle({
        foreignCollectionName: "Posts",
        fieldName: "postId",
      }),
    },
  },
  revisionId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Revisions",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canCreate: ["admins"],
    },
  },
  summary: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canCreate: ["admins"],
    },
  },
  modelId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canCreate: ["admins"],
    },
  },
  promptVersion: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canCreate: ["admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"PostSummaries">>;

export default schema;
