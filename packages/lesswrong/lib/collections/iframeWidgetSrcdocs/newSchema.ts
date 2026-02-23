import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  revisionId: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
      foreignKey: "Revisions",
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },

  html: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"IframeWidgetSrcdocs">>;

export default schema;
