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
  },
  // Per-sandbox so a compromised sandbox cannot impersonate another.
  supervisorSecret: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  devProxySecret: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ResearchSandboxSessions">>;

export default schema;
