import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

/** The first time a digest's recipient followed a link to one of its items. */
const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  issueId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "AiDigestIssues",
      nullable: false,
    },
  },
  sectionKind: {
    database: {
      type: "TEXT",
      nullable: false,
      typescriptType: "AiDigestSectionKind",
    },
  },
  itemIndex: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
  },
  firstClickedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"AiDigestItemClicks">>;

export default schema;
