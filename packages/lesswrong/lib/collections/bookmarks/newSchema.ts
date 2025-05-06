import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";
import { accessFilterSingle } from "../../utils/schemaUtils";

const ALLOWED_COLLECTION_NAMES = ["Posts", "Comments"];

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  documentId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String!",
      canRead: ['guests'],
      canCreate: ['members'],
      canUpdate: [userOwns],
    },
  },

  collectionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String!",
      canRead: ['guests'],
      canCreate: ['members'],
      validation: {
        allowedValues: ALLOWED_COLLECTION_NAMES,
      },
    },
  },

  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ['guests'],
      canCreate: ['members'],
    },
  },

  post: {
    graphql: {
      outputType: 'Post',
      canRead: ['guests'],
      resolver: async (bookmark: DbBookmark, args: any, context: ResolverContext) => {
        const { currentUser } = context;
        const { documentId, collectionName } = bookmark;
        if (collectionName !== "Posts") {
            return null;
        }
        const post = await context.loaders.Posts.load(documentId);
        return await accessFilterSingle(currentUser, "Posts", post, context);
      }
    }
  },

  comment: {
    graphql: {
      outputType: 'Comment',
      canRead: ['guests'],
      resolver: async (bookmark: DbBookmark, args: any, context: ResolverContext) => {
        const { currentUser } = context;
        const { documentId, collectionName } = bookmark;
        if (collectionName !== "Comments") {
            return null;
        }
        const comment = await context.loaders.Comments.load(documentId);
        return await accessFilterSingle(currentUser, "Comments", comment, context);
      }
    }
  },

  lastUpdated: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date!",
      canRead: ['guests'],
      onCreate: () => new Date(),
    },
  },

  active: {
    database: {
      type: "BOOL",
      defaultValue: false,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ['guests'],
      canCreate: ['members'],
      canUpdate: [userOwns],
    },
  },

} satisfies Record<string, CollectionFieldSpecification<"Bookmarks">>;

export default schema;
