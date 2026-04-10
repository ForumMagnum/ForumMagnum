import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  hashedToken: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  clientId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
  },
  scope: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  expiresAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  revokedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
  },
  resource: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"OAuthAccessTokens">>;

export default schema;
