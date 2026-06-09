import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";

const userOwnsBlock = (user: DbUser | null, document: HasUserIdType) => {
  return !!user && user._id === document.userId;
};

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwnsBlock, "sunshineRegiment", "admins"],
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: [userOwnsBlock, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  blockedUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwnsBlock, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  blockedUser: {
    graphql: {
      outputType: "User",
      canRead: [userOwnsBlock, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "blockedUserId" }),
    },
  },
  blocked: {
    database: {
      type: "BOOL",
      nullable: false,
      defaultValue: true,
      canAutofillDefault: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userOwnsBlock, "sunshineRegiment", "admins"],
      canUpdate: [userOwnsBlock, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"UserBlocks">>;

export default schema;
