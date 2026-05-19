import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

/**
 * The dependency-install cache. Each row is a Vercel snapshot of a sandbox
 * with one repo's dependencies installed and no conversation-specific state.
 * Server-internal — never exposed to clients. Looked up by
 * `(workspaceRepoId, manifestHash)`; rows are never deleted.
 */
const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  workspaceRepoId: {
    database: { type: "VARCHAR(27)", foreignKey: "WorkspaceRepos", nullable: false },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  // SHA-256 (hex) of the lockfile content at `WorkspaceRepos.lockfilePath`.
  manifestHash: {
    database: { type: "TEXT", nullable: false },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  vercelSnapshotId: {
    database: { type: "TEXT", nullable: false },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  // Reported by Vercel. DOUBLE PRECISION (not INTEGER) because a snapshot can
  // exceed the ~2.1 GB INTEGER ceiling. Database-only — not exposed via GraphQL.
  sizeBytes: {
    database: { type: "DOUBLE PRECISION", nullable: true },
  },
} satisfies Record<string, CollectionFieldSpecification<"RepoInstallSnapshots">>;

export default schema;
