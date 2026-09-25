import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

const userIsIssueRecipient = (user: DbUser | null, issue: DbAiDigestIssue): boolean =>
  !!user && user._id === issue.recipientId;

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  recipientId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },
  /** When the issue was successfully emailed; null for issues never sent. */
  emailedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["admins"],
    },
  },
  trigger: {
    database: {
      type: "TEXT",
      defaultValue: "adminSample",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "AiDigestIssueTrigger",
      canRead: [userIsIssueRecipient, "admins"],
      validation: {
        allowedValues: ["adminSample", "userPreview", "scheduled"],
        optional: true,
      },
    },
  },
  countsTowardHistory: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: [userIsIssueRecipient, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  spec: {
    database: {
      type: "JSONB",
      nullable: false,
      typescriptType: "AiDigestSpec",
    },
    graphql: {
      outputType: "JSON",
      canRead: [userIsIssueRecipient, "admins"],
    },
  },
  subject: {
    graphql: {
      outputType: "String",
      canRead: [userIsIssueRecipient, "admins"],
      resolver: (issue) => issue.spec.subject,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"AiDigestIssues">>;

export default schema;
