import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  email: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["admins"],
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
    graphql: {
      outputType: "Date!",
      canRead: ["admins"],
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
    graphql: {
      outputType: "Int",
      canRead: ["admins"],
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
    graphql: {
      outputType: "String!",
      canRead: ["admins"],
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
    graphql: {
      outputType: "String",
      canRead: ["admins"],
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
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
    },
  },

  // A few parsed fields for convenience/querying.
  isValid: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins"],
    },
  },

  risk: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  reason: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  didYouMean: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  isDisposableAddress: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins"],
    },
  },

  isRoleAddress: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins"],
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
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"MailgunValidations">>;

export default schema;


