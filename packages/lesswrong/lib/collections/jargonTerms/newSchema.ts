// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { generateIdResolverSingle, getFillIfMissing, throwIfSetToNull } from "../../utils/schemaUtils";
import { getAdminTeamAccountId } from "@/server/utils/adminTeamAccount";

const schema: Record<string, NewCollectionFieldSpecification<"JargonTerms">> = {
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
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("JargonTerms", "contents"),
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
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  post: {
    graphql: {
      type: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "JargonTerms", fieldName: "postId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  term: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "String",
      canRead: ["guests"],
      validation: {
        allowedValues: ["humans", "AI", "humansAndAI"],
      },
      resolver: async (document, args, context) => {
        const botAccountId = await getAdminTeamAccountId();
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      onCreate: getFillIfMissing([]),
      onUpdate: throwIfSetToNull,
    },
    form: {
      order: 30,
      label: "Alternative Terms",
      tooltip: "Comma-separated, no spaces",
    },
  },
};

export default schema;
