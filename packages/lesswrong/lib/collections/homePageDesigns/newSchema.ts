import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  // Either a userId (for logged-in users) or a clientId (for logged-out users).
  ownerId: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },

  // Shared across all revisions of the same theme. Set to the _id of the
  // first record when a theme is first created; subsequent revisions reuse it.
  publicId: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
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

  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },

  verified: {
    database: {
      type: "BOOL",
      defaultValue: false,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      canRead: ["guests"],
      canUpdate: ["admins"],
    },
  },

  // Presence indicates the design is published. Points to a comment on the
  // marketplace post where users can vote/discuss.
  commentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },

  // "internal" (created via embedded chat) or "external" (created via API by
  // an external agent).
  source: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },

  // The model used to generate the design, e.g. "claude-sonnet-4.6",
  // "gpt-5.4". Set by us for internal designs, provided by the agent for
  // external ones.
  modelName: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },

  // Result of the automated LLM security review. null = not yet reviewed.
  autoReviewPassed: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins"],
    },
  },

  // Issue description from the automated review, if it failed. null when
  // not yet reviewed or when the review passed.
  autoReviewMessage: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
    },
  },

  // Access control for this field is handled by the custom query resolvers,
  // which strip it for non-owners.
  conversationHistory: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      outputType: "JSON!",
      canRead: ["guests"],
      validation: {
        blackbox: true,
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"HomePageDesigns">>;

export default schema;
