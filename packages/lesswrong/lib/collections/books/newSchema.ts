// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { defaultEditorPlaceholder, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { arrayOfForeignKeysOnCreate, generateIdResolverMulti, getFillIfMissing } from "../../utils/schemaUtils";
import { documentIsNotDeleted, userOwns } from "@/lib/vulcan-users/permissions";

const schema: Record<string, NewCollectionFieldSpecification<"Books">> = {
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
  contents: {
    graphql: {
      type: "Revision",
      canRead: [documentIsNotDeleted],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Books", "contents"),
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "contents",
        collectionName: "Books",
        commentEditor: false,
        commentStyles: false,
        hideControls: false,
      },
      order: 20,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (book, name) => {
          if (book._id) {
            return {
              id: `${book._id}_${name}`,
              verify: true,
            };
          }
          return {
            id: `collection: ${book.collectionId}_${name}`,
            verify: false,
          };
        },
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
  postedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  title: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  subtitle: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  tocTitle: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  collectionId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Collections",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  number: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  postIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
    form: {
      control: "PostsListEditor",
    },
  },
  posts: {
    graphql: {
      type: "[Post!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Books", fieldName: "postIds" }),
    },
    form: {
      hidden: true,
    },
  },
  sequenceIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
    form: {
      control: "SequencesListEditor",
    },
  },
  sequences: {
    graphql: {
      type: "[Sequence!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Books", fieldName: "sequenceIds" }),
    },
    form: {
      hidden: true,
    },
  },
  displaySequencesAsGrid: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  hideProgressBar: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  showChapters: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
};

export default schema;
