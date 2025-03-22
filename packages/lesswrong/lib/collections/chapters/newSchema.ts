// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { defaultEditorPlaceholder, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { arrayOfForeignKeysOnCreate, generateIdResolverMulti, generateIdResolverSingle } from "../../utils/schemaUtils";
import { documentIsNotDeleted, userOwns } from "@/lib/vulcan-users/permissions";

export const formGroups = {
  chapterDetails: {
    name: "chapterDetails",
    order: 25,
    label: "Chapter Details",
    startCollapsed: true,
  },
} satisfies Partial<Record<string, FormGroupType<"Chapters">>>;

const schema = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      onUpdate: () => 1,
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  contents: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: [documentIsNotDeleted],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Chapters", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "contents",
        collectionName: "Chapters",
        commentEditor: false,
        commentStyles: false,
        hideControls: false,
      },
      order: 30,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (chapter, name) => {
          if (chapter._id) {
            return {
              id: `${chapter._id}_${name}`,
              verify: true,
            };
          }
          return {
            id: `sequence: ${chapter.sequenceId}_${name}`,
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
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  revisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("revisions"),
    },
  },
  version: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("version"),
    },
  },
  title: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 10,
      placeholder: "Title",
      group: () => formGroups.chapterDetails,
    },
  },
  subtitle: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 20,
      placeholder: "Subtitle",
      group: () => formGroups.chapterDetails,
    },
  },
  number: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.chapterDetails,
    },
  },
  sequenceId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Sequences",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  sequence: {
    graphql: {
      outputType: "Sequence!",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Sequences", fieldName: "sequenceId" }),
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
      outputType: "[String]",
      inputType: "[String]!",
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
      outputType: "[Post!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Posts", fieldName: "postIds" }),
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Chapters">>;

export default schema;
