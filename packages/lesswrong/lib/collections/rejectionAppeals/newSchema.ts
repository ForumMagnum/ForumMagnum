import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  commentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  comment: {
    graphql: {
      outputType: "Comment",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Comments", fieldName: "commentId" }),
    },
  },
  conversationId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Conversations",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
    },
  },
  conversation: {
    graphql: {
      outputType: "Conversation",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Conversations", fieldName: "conversationId" }),
    },
  },
  explanation: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  // Ids from APPEAL_REASONS that the user selected as why their content was rejected
  reasonIds: {
    database: {
      type: "TEXT[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String!]!",
      inputType: "[String!]!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  // Whether the user confirmed that the common misunderstandings for these reasons aren't the basis of their appeal
  acknowledgedMisunderstandings: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  status: {
    database: {
      type: "TEXT",
      defaultValue: "open",
      canAutofillDefault: true,
      nullable: false,
      typescriptType: "'open' | 'approved' | 'denied'",
    },
    graphql: {
      outputType: "RejectionAppealStatus",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      validation: {
        allowedValues: ["open", "approved", "denied"],
        optional: true,
      },
    },
  },
  resolvedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
  resolvedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"RejectionAppeals">>;

export default schema;
