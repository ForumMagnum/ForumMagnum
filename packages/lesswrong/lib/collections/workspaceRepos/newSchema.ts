import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";

/**
 * An immutable, user-owned configuration for setting up and running one code
 * repository. Created whole by `createWorkspaceRepo` and never updated or
 * deleted — changing a repo's config means inserting a new row. A coding
 * conversation pins one row, so its configuration is fixed for its lifetime.
 *
 * `(userId, host, owner, name)` is intentionally not unique: several immutable
 * config rows per physical repo are expected, and the *current* config is the
 * most recent row by `createdAt` within that group.
 */
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
  // Selects the sandbox runtime (e.g. `node24`, `python3.13`). Cannot be a
  // GraphQL enum because `python3.13` is not a valid enum identifier.
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
  // Hashed by `RepoInstallSnapshots.manifestHash`; `dirname(lockfilePath)` is
  // the working directory for the install/prepare/dev commands.
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
  // Non-null exactly when `devCommand` is.
  devPort: {
    database: { type: "INTEGER", nullable: true },
    graphql: {
      outputType: "Int",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"WorkspaceRepos">>;

export default schema;
