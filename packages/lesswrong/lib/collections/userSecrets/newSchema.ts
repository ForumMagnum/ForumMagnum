import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";

/**
 * Arbitrary user-scoped secrets — the GitHub token, the Claude Code OAuth
 * token, per-repo dev-server `.env` values. `encryptedValue` is encrypted at
 * rest (`userSecretsCrypto`) and has no GraphQL exposure at all; clients can
 * read only the list of secret names and scopes, never values.
 *
 * A secret name is unique within its scope (enforced by two partial unique
 * indexes, in the migration): `repoScope IS NULL` is a secret global to the
 * user; a non-null `repoScope` — a normalized `host/owner/name` — scopes it to
 * one repo, so two repos can each carry their own `DATABASE_URL`.
 */
const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
  // A normalized `host/owner/name` repo identity, or null for a secret global
  // to the user.
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
  // Database-only — no `graphql` spec, so it is never exposed via the API.
  // Encrypted at rest with `userSecretsCrypto`.
  encryptedValue: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  // Write-only field: plaintext on input, encrypted into
  // `encryptedValue` by the create/update mutation.
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
