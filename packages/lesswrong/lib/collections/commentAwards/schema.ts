import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
  DEFAULT_LEGACY_DATA_FIELD,
  DEFAULT_SCHEMA_VERSION_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
  },
  commentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
      nullable: false,
    },
  },
  isDeleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
  },
  notifiedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
  },
  count: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"CommentAwards">>;

export default schema
