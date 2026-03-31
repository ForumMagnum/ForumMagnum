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
