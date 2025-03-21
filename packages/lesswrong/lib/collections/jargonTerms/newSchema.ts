// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { getAdminTeamAccountId } from "@/server/utils/adminTeamAccount";

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
