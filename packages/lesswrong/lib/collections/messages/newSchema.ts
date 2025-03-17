// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { generateIdResolverSingle, getFillIfMissing, throwIfSetToNull } from "../../utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"Messages">> = {
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
      canRead: ["members"],
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
  contents: {
    graphql: {
      type: "Revision",
      canRead: ["members"],
      canUpdate: function (user, document) {
        if (!user) {
          // not logged in
          return false;
        }
        if (!document) {
          // no document specified
          return false;
        }
        if (document.userId) {
          // case 1: document is a post or a comment, use userId to check
          return user._id === document.userId;
        } else {
          // case 2: document is a user, use _id or slug to check
          const documentUser = document;
          const idsExistAndMatch = !!user._id && !!documentUser._id && user._id === documentUser._id;
          const slugsExistAndMatch = !!user.slug && !!documentUser.slug && user.slug === documentUser.slug;
          return idsExistAndMatch || slugsExistAndMatch;
        }
      },
      canCreate: ["members"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Messages", "contents"),
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "contents",
        collectionName: "Messages",
        commentEditor: true,
        commentStyles: true,
        hideControls: false,
      },
      order: 2,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Messages"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  contents_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  revisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("revisions"),
    },
  },
  version: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("version"),
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
      canCreate: ["admins"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: ["members"],
      resolver: generateIdResolverSingle({ collectionName: "Messages", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  conversationId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Conversations",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  conversation: {
    graphql: {
      type: "Conversation!",
      canRead: ["members"],
      resolver: generateIdResolverSingle({ collectionName: "Messages", fieldName: "conversationId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  noEmail: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["admins"],
      canCreate: ["admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
};

export default schema;
