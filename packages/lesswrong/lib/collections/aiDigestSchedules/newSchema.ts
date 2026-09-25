import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
  },
  nextDueAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  claimedUntil: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
  },
  /** An issue generated for this reader that hasn't been sent yet, to be sent rather than regenerated. */
  issueId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "AiDigestIssues",
      nullable: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"AiDigestSchedules">>;

export default schema;
