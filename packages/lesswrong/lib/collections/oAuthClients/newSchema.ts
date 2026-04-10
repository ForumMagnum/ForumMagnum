import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  hashedSecret: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  clientName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  redirectUris: {
    database: {
      type: "TEXT[]",
      nullable: false,
    },
  },
  grantTypes: {
    database: {
      type: "TEXT[]",
      nullable: false,
    },
  },
  responseTypes: {
    database: {
      type: "TEXT[]",
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"OAuthClients">>;

export default schema;
