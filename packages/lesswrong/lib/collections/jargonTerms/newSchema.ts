import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { getDenormalizedEditableResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from "../revisions/revisionSchemaTypes";
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
      inputType: "CreateRevisionDataInput",
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
  },
  contents_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
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
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
      outputType: "[String!]!",
      inputType: "[String!]!",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"JargonTerms">>;

export default schema;
