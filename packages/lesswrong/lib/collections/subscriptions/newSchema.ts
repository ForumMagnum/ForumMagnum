import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["members"],
      onCreate: ({ currentUser }) => currentUser?._id,
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["members"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  state: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["subscribed", "suppressed"],
      },
    },
  },
  documentId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  collectionName: {
    database: {
      type: "TEXT",
      typescriptType: "CollectionNameString",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  deleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
      canCreate: ["members"],
      validation: {
        allowedValues: [
          "newComments",
          "newUserComments",
          "newShortform",
          "newPosts",
          "newRelatedQuestions",
          "newEvents",
          "newReplies",
          "newTagPosts",
          "newSequencePosts",
          "newDebateComments",
          "newDialogueMessages",
          "newPublishedDialogueMessages",
          "newActivityForFeed",
        ],
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"Subscriptions">>;

export default schema;
