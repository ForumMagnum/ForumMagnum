import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  hashedCode: {
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
  redirectUri: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  scope: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  codeChallenge: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  codeChallengeMethod: {
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
  used: {
    database: {
      type: "BOOL",
      defaultValue: false,
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"OAuthAuthorizationCodes">>;

export default schema;
