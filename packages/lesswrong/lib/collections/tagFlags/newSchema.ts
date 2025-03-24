// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { defaultEditorPlaceholder, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { documentIsNotDeleted, userOwns } from "@/lib/vulcan-users/permissions";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
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
      resolver: getDenormalizedEditableResolver("TagFlags", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "contents",
        collectionName: "TagFlags",
        commentEditor: false,
        commentStyles: false,
        hideControls: false,
      },
      order: 30,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (tagFlag, name) => {
          if (tagFlag._id) {
            return {
              id: `${tagFlag._id}_${name}`,
              verify: true,
            };
          }
          return {
            id: `tagFlag: ${name}`,
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
  slug: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["TagFlags"],
        getTitle: (tf) => tf.name,
        onCollision: "newDocumentGetsSuffix",
        includesOldSlugs: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  name: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["members", "admins", "sunshineRegiment"],
      canCreate: ["members", "admins", "sunshineRegiment"],
    },
    form: {
      order: 1,
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
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 2,
    },
  },
  order: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {},
  },
} satisfies Record<string, NewCollectionFieldSpecification<"TagFlags">>;

export default schema;
