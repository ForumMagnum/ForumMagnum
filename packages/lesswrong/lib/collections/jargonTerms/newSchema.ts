// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { getAdminTeamAccountId } from "@/server/utils/adminTeamAccount";

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
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("JargonTerms", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () =>
          "If you want to add a custom term, use this form.  The description goes here.  The term, as well as any alt terms, must appear in your post.",
        fieldName: "contents",
        collectionName: "JargonTerms",
        commentEditor: true,
        commentStyles: true,
        hideControls: true,
      },
      order: 10,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("JargonTerms"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  contents_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["members"],
    },
    form: {
      hidden: true,
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  term: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
    form: {
      order: 20,
    },
  },
  humansAndOrAIEdited: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const botAccountId = await getAdminTeamAccountId(context);
        if (!botAccountId) {
          return null;
        }
        const { Revisions } = context;
        const selector = {
          documentId: document._id,
          collectionName: "JargonTerms",
        };
        const [earliestRevision, latestRevision] = await Promise.all([
          Revisions.findOne(selector, {
            sort: {
              createdAt: 1,
            },
          }),
          Revisions.findOne(selector, {
            sort: {
              createdAt: -1,
            },
          }),
        ]);
        if (!earliestRevision || !latestRevision) {
          return null;
        }
        const madeByAI = earliestRevision.userId === botAccountId;
        const editedByHumans = latestRevision.userId !== botAccountId;
        if (madeByAI && editedByHumans) {
          return "humansAndAI";
        } else if (!madeByAI && editedByHumans) {
          return "humans";
        } else {
          return "AI";
        }
      },
      validation: {
        allowedValues: ['humans', 'AI', 'humansAndAI'],
        optional: true,
      },
    },
  },
  approved: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
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
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  altTerms: {
    database: {
      type: "TEXT[]",
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
    },
    form: {
      order: 30,
      label: "Alternative Terms",
      tooltip: "Comma-separated, no spaces",
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"JargonTerms">>;

export default schema;
