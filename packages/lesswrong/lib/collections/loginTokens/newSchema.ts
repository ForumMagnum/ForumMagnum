import { DEFAULT_ID_FIELD } from "../helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  hashedToken: {
    database: {
      type: "TEXT",
      nullable: false,
    }
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  userId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  loggedOutAt: {
    database: {
      type: "BOOL",
      nullable: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"LoginTokens">>;

export default schema;
