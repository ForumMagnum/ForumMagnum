import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

/**
 * Durable record of engagement events reported by Mailgun's webhooks. Mailgun only
 * keeps its own event logs for 1–30 days depending on plan, and digest selection
 * needs to ask "did they click what we recommended last month?", so the key
 * attribution facts are mirrored here next to `AiDigestIssues`.
 *
 * Deliberately narrow: fine-grained detail (the `emailSrc` slot/role, Mailgun's
 * `client-info` blob) goes only to the analytics DB. Deliberately does not store
 * the recipient's email address — `userId` identifies them already.
 *
 * Written server-side only, from the webhook route.
 */
const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  /** Mailgun event name. Currently only "clicked" is ingested. */
  eventType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  /**
   * Mailgun's own event id. Webhook delivery is at-least-once, so this carries a
   * unique index and ingestion upserts on it.
   */
  mailgunEventId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  /** From the `v:emailType` send-time variable, e.g. "aiDigest". */
  emailType: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  /** From `v:campaignId`. For the digest, the AiDigestIssues._id. */
  campaignId: {
    database: {
      type: "VARCHAR(27)",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  /** From `v:recipientId`. */
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  /** The raw clicked URL, kept as ground truth in case the parsing below drifts. */
  url: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  /** Parsed from the clicked URL's path: "post" or "comment". */
  documentType: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  documentId: {
    database: {
      type: "VARCHAR(27)",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  /**
   * Mailgun's `client-info.bot` flag. Email scanners and link proxies click links,
   * so this is the first filter on inflated counts.
   */
  isBot: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins"],
    },
  },

  /** When Mailgun recorded the event, as opposed to when we ingested it. */
  occurredAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"EmailEvents">>;

export default schema;
