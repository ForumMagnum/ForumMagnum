import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  conversationId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ResearchConversations",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  // Per-sandbox HMAC key. Generated once when the conversation's sandbox is
  // first provisioned, then re-injected into the sandbox env as
  // SUPERVISOR_SECRET on every (re)launch of the supervisor. The backend signs
  // short-lived dispatch/SSE tokens with it; the supervisor validates inbound
  // tokens against its env copy. Per-sandbox so a compromised sandbox cannot
  // impersonate another. Stored in plaintext: its blast radius is one sandbox.
  supervisorSecret: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ResearchSandboxSessions">>;

export default schema;
