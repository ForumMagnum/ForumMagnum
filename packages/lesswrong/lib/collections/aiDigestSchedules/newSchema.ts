import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

/**
 * When each subscriber is next due a scheduled digest, and which run is
 * currently working on it. Server-only; the hourly job claims a row before
 * generating, so overlapping runs never work on the same reader.
 */
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
  /** Set while a run is generating or sending this reader's issue; a crashed run's claim lapses. */
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
