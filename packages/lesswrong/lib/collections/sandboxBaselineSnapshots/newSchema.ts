import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

/**
 * One baseline snapshot per supported runtime — a freshly-provisioned sandbox
 * with claude-code, the supervisor bundle, and the research-tool CLI installed,
 * and no user code. Built offline by `buildResearchSandboxSnapshot`. Server-internal.
 */
const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  // `node22` | `node24` | `node26` | `python3.13`. Unique (one row per runtime).
  runtime: {
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
  // When the snapshot was built — rebuild when claude-code / the supervisor change.
  builtAt: {
    database: { type: "TIMESTAMPTZ", nullable: false },
    graphql: {
      outputType: "Date",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"SandboxBaselineSnapshots">>;

export default schema;
