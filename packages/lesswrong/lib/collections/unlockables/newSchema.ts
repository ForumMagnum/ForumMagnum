import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "../helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  userId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  clientId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },
  unlockablesState: {
    database: {
      type: "JSONB",
      nullable: false,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Unlockables">>;

export default schema;
