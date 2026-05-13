import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";

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
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  projectId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ResearchProjects",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  vercelSandboxId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  endpointUrl: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  // provisioning | active | idle | stopped
  status: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  // Per-sandbox HMAC key. Generated at provision time by sandboxManager,
  // injected into the sandbox env as SUPERVISOR_SECRET. The backend reads
  // this column to mint short-lived SSE tokens for the user-facing
  // stream-info endpoint; the supervisor validates inbound tokens against
  // its env copy. Per-sandbox (rather than a global secret) so a compromised
  // sandbox can't impersonate other sandboxes.
  supervisorSecret: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      // Admin-only: this is a credential.
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  // Current count of running conversations on this sandbox. Updated by the
  // heartbeat-receiving endpoint from supervisor reports. sandboxManager reads
  // this to decide spillover when an inbound dispatch would exceed the
  // per-sandbox concurrency cap.
  concurrencyCount: {
    database: {
      type: "INTEGER",
      defaultValue: 0,
      nullable: false,
    },
    graphql: {
      outputType: "Int",
      inputType: "Int!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  lastUsedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
      defaultValue: "current_timestamp",
      canAutofillDefault: true,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
  expiresAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ResearchSandboxSessions">>;

export default schema;
