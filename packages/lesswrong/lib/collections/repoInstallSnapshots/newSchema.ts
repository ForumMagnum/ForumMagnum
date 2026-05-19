import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  workspaceRepoId: {
    database: { type: "VARCHAR(27)", foreignKey: "WorkspaceRepos", nullable: false },
  },
  manifestHash: {
    database: { type: "TEXT", nullable: false },
  },
  vercelSnapshotId: {
    database: { type: "TEXT", nullable: false },
  },
  // DOUBLE PRECISION because snapshots can exceed the ~2.1 GB INTEGER ceiling.
  sizeBytes: {
    database: { type: "DOUBLE PRECISION", nullable: true },
  },
} satisfies Record<string, CollectionFieldSpecification<"RepoInstallSnapshots">>;

export default schema;
