// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing, throwIfSetToNull } from "../../utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"Subscriptions">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["members"],
      onCreate: ({ currentUser }) => currentUser._id,
    },
  },
  user: {
    graphql: {
      type: "User!",
      canRead: ["members"],
      resolver: generateIdResolverSingle({ collectionName: "Subscriptions", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  state: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "String",
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
      type: "String",
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
      type: "Boolean",
      canRead: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
};

export default schema;
