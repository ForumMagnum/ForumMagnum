import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  narrationScriptId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "NarrationScripts",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  segmentIndex: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
    },
  },
  startBlockIndex: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
    },
  },
  endBlockIndex: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
    },
  },
  characterCount: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"NarrationSegments">>;

export default schema;
