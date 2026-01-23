import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  documentId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  yjsState: {
    database: {
      type: "BYTEA",
      nullable: false,
    },
  },
  yjsStateVector: {
    database: {
      type: "BYTEA",
      nullable: false,
    },
  },
  updatedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"YjsDocuments">>;

export default schema;
