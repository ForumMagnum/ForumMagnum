import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
  },
  revisionId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Revisions",
      nullable: false,
    },
  },
  previewHtml: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  modelId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  promptVersion: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"PostPreviews">>;

export default schema;
