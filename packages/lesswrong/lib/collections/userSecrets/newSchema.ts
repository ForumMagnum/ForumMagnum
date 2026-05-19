import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";

// Scoped uniqueness is enforced by partial unique indexes in the migration:
// `(userId, name)` where `repoScope IS NULL`, and `(userId, repoScope, name)` otherwise.
const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
  },
  repoScope: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
  name: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  encryptedValue: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  value: {
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"UserSecrets">>;

export default schema;
