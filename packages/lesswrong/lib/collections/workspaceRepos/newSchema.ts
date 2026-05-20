import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";

// Immutable: config changes insert a new row. A coding conversation pins one row
// for its lifetime. `(userId, host, owner, name)` is intentionally not unique.
const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  userId: {
    database: { type: "VARCHAR(27)", foreignKey: "Users", nullable: false },
    graphql: {
      outputType: "String",
      inputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
  host: {
    database: { type: "TEXT", nullable: false },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  owner: {
    database: { type: "TEXT", nullable: false },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  name: {
    database: { type: "TEXT", nullable: false },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  defaultBranch: {
    database: { type: "TEXT", nullable: false },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  // TEXT not enum: `python3.13` is not a valid GraphQL enum identifier.
  runtime: {
    database: { type: "TEXT", nullable: false },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  // `dirname(lockfilePath)` is the cwd for install/prepare/dev commands.
  lockfilePath: {
    database: { type: "TEXT", nullable: false },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  installCommand: {
    database: { type: "TEXT", nullable: false },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  prepareCommand: {
    database: { type: "TEXT", nullable: true },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
  devCommand: {
    database: { type: "TEXT", nullable: true },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"WorkspaceRepos">>;

export default schema;
