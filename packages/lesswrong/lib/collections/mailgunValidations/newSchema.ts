import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  email: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },

  /**
   * Whether this validation was requested with mailbox verification enabled.
   * Mailgun treats this as an option that can materially change results/cost/time.
   */
  mailboxVerification: {
    database: {
      type: "BOOL",
      defaultValue: false,
      nullable: false,
    },
  },

  /**
   * When we attempted the validation (success or failure).
   */
  validatedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },

  /**
   * HTTP status from Mailgun (when available).
   */
  httpStatus: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
  },

  /**
   * One of: "success" | "error".
   */
  status: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },

  /**
   * Error string for failures (network/timeout/4xx/5xx), if any.
   */
  error: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },

  /**
   * Raw JSON response body from Mailgun (when available).
   */
  result: {
    database: {
      type: "JSONB",
      nullable: true,
    },
  },

  // A few parsed fields for convenience/querying.
  isValid: {
    database: {
      type: "BOOL",
      nullable: true,
    },
  },

  risk: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },

  reason: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },

  didYouMean: {
    database: {
      type: "TEXT",
      nullable: true,
    },
  },

  isDisposableAddress: {
    database: {
      type: "BOOL",
      nullable: true,
    },
  },

  isRoleAddress: {
    database: {
      type: "BOOL",
      nullable: true,
    },
  },

  /**
   * The userId that caused this email to be scheduled (best-effort; not always set).
   */
  sourceUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"MailgunValidations">>;

export default schema;


