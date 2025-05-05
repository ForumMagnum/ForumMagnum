import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";
import gql from "graphql-tag";

const ALLOWED_COLLECTION_NAMES = ["Posts", "Comments"];

export const graphqlTypeDefs = gql`
  union BookmarkableDocument = Post | Comment
`;

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
        const { documentId, collectionName } = bookmark;
        const { Posts } = context;
        if (collectionName !== "Posts") {
            return null;
        }
        return await Posts.findOne({ _id: documentId });
      }
    }
  },

  lastUpdated: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ['guests'],
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    },
  },

  cancelled: {
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
