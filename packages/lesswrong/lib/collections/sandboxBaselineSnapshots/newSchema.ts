import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  runtime: {
    database: { type: "TEXT", nullable: false },
  },
  vercelSnapshotId: {
    database: { type: "TEXT", nullable: false },
  },
  builtAt: {
    database: { type: "TIMESTAMPTZ", nullable: false },
  },
} satisfies Record<string, CollectionFieldSpecification<"SandboxBaselineSnapshots">>;

export default schema;
