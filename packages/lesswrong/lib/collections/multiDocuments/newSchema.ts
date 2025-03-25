// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import {
  accessFilterSingle, generateIdResolverSingle,
} from "@/lib/utils/schemaUtils";
import { getTextLastUpdatedAtFieldResolver } from "../helpers/textLastUpdatedAtField";
import { getArbitalLinkedPagesFieldResolver } from "../helpers/arbitalLinkedPagesField";
import { getSummariesFieldResolver, getSummariesFieldSqlResolver } from "../helpers/summariesField";
import { formGroups } from "./formGroups";
import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import { defaultEditorPlaceholder, getNormalizedEditableResolver, getNormalizedEditableSqlResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { DEFAULT_AF_BASE_SCORE_FIELD, DEFAULT_AF_EXTENDED_SCORE_FIELD, DEFAULT_AF_VOTE_COUNT_FIELD, DEFAULT_BASE_SCORE_FIELD, DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD, DEFAULT_CURRENT_USER_VOTE_FIELD, DEFAULT_EXTENDED_SCORE_FIELD, DEFAULT_INACTIVE_FIELD, DEFAULT_SCORE_FIELD, defaultVoteCountField } from "@/lib/make_voteable";
import { getToCforMultiDocument } from "@/server/tableOfContents";
import { getContributorsFieldResolver } from "@/lib/collections/helpers/contributorsField";

const MULTI_DOCUMENT_DELETION_WINDOW = 1000 * 60 * 60 * 24 * 7;

export function userCanDeleteMultiDocument(user: DbUser | UsersCurrent | null, document: DbMultiDocument) {
  if (userIsAdminOrMod(user)) {
    return true;
  }

  const deletableUntil = new Date(document.createdAt).getTime() + MULTI_DOCUMENT_DELETION_WINDOW;
  const withinDeletionWindow = deletableUntil > Date.now();

  return userOwns(user, document) && withinDeletionWindow;
}

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: {
    ...DEFAULT_LEGACY_DATA_FIELD,
    graphql: {
      ...DEFAULT_LEGACY_DATA_FIELD.graphql,
      canRead: ["guests"],
    },
  },
  contents: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: true, normalized: true },
      arguments: "version: String",
      resolver: getNormalizedEditableResolver("contents"),
      sqlResolver: getNormalizedEditableSqlResolver("contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "contents",
        collectionName: "MultiDocuments",
        commentEditor: false,
        commentStyles: true,
        hideControls: false,
      },
      order: 30,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (multiDocument, name) => {
          const { _id, parentDocumentId, collectionName } = multiDocument;
          return {
            id: `multiDocument:${collectionName}:${parentDocumentId}:${_id}`,
            verify: false,
          };
        },
        revisionsHaveCommitMessages: true,
      },
    },
  },
  contents_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  pingbacks: {
    database: {
      type: "JSONB",
      denormalized: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: "guests",
      validation: {
        optional: true,
      },
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
        collectionsToAvoidCollisionsWith: ["Tags", "MultiDocuments"],
        getTitle: (md) => md.title ?? md.tabTitle,
        onCollision: "rejectNewDocument",
        includesOldSlugs: true,
      },
      validation: {
        optional: true,
      },
    },
  },
  oldSlugs: {
    database: {
      type: "TEXT[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[String]",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  // In the case of tag lenses, this is the title displayed in the body of the tag page when the lens is selected.
  // In the case of summaries, we don't have a title that needs to be in the "body"; we just use the tab title in the summary tab.
  title: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 5,
      hidden: ({ formProps, document }) => !formProps?.lensForm && document?.fieldName !== "description",
    },
  },
  preview: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  tabTitle: {
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
      order: 10,
    },
  },
  tabSubtitle: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 20,
      hidden: ({ formProps, document }) => !formProps?.lensForm && document?.fieldName !== "description",
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      onCreate: ({ currentUser }) => currentUser?._id,
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  parentDocumentId: {
    database: {
      type: "TEXT",
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
  parentTag: {
    graphql: {
      outputType: "Tag",
      canRead: ["guests"],
      resolver: async (multiDocument, _, context) => {
        const { loaders, currentUser } = context;
        if (multiDocument.collectionName !== "Tags") {
          return null;
        }
        const parentTag = await loaders.Tags.load(multiDocument.parentDocumentId);
        return accessFilterSingle(currentUser, "Tags", parentTag, context);
      },
      sqlResolver: ({ field, join }) =>
        join({
          table: "Tags",
          type: "left",
          on: {
            _id: field("parentDocumentId"),
          },
          resolver: (tagField) => tagField("*"),
        }),
    },
  },
  parentLens: {
    graphql: {
      outputType: "MultiDocument",
      canRead: ["guests"],
      resolver: async (multiDocument, _, context) => {
        const { loaders, currentUser, MultiDocuments } = context;
        if (multiDocument.collectionName !== "MultiDocuments") {
          return null;
        }
        const parentMultiDocuments = await loaders.MultiDocuments.load(multiDocument.parentDocumentId);
        return accessFilterSingle(currentUser, "MultiDocuments", parentMultiDocuments, context);
      },
      sqlResolver: ({ field, join }) =>
        join({
          table: "MultiDocuments",
          type: "left",
          on: {
            _id: field("parentDocumentId"),
          },
          resolver: (multiDocField) => multiDocField("*"),
        }),
    },
  },
  collectionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["Tags", "MultiDocuments"],
      },
    },
    form: {
      hidden: true,
    },
  },
  // e.g. content, description, summary.  Whatever it is that we have "multiple" of for a single parent document.
  fieldName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["description", "summary"],
      },
    },
    form: {
      hidden: true,
    },
  },
  index: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["members"],
      onCreate: async ({ newDocument, context }) => {
        const { MultiDocuments } = context;
        const { parentDocumentId } = newDocument;
        const otherSummaries = await MultiDocuments.find({ parentDocumentId, fieldName: newDocument.fieldName }, undefined, { index: 1 }).fetch();
        const otherSummaryIndexes = otherSummaries.map((summary) => summary.index);
        const newIndex = otherSummaryIndexes.length > 0 ? Math.max(...otherSummaryIndexes) + 1 : 0;
        return newIndex;
      },
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  tableOfContents: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      arguments: "version: String",
      resolver: async (document, { version }, context) => {
        return await getToCforMultiDocument({
          document,
          version,
          context,
        });
      },
    },
  },
  // basically the same thing for both tag main pages and lenses
  contributors: {
    graphql: {
      outputType: "TagContributorsList",
      canRead: ["guests"],
      arguments: "limit: Int, version: String",
      resolver: getContributorsFieldResolver({ collectionName: "MultiDocuments", fieldName: "contents" }),
    },
  },
  contributionStats: {
    database: {
      type: "JSONB",
      denormalized: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  arbitalLinkedPages: {
    graphql: {
      outputType: "ArbitalLinkedPages",
      canRead: ["guests"],
      resolver: getArbitalLinkedPagesFieldResolver({ collectionName: "MultiDocuments" }),
    },
  },
  htmlWithContributorAnnotations: {
    database: {
      type: "TEXT",
      denormalized: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  summaries: {
    graphql: {
      outputType: "[MultiDocument!]!",
      canRead: ["guests"],
      resolver: getSummariesFieldResolver("MultiDocuments"),
      sqlResolver: getSummariesFieldSqlResolver("MultiDocuments"),
    },
    form: {
      control: "SummariesEditForm",
      group: () => formGroups.summaries,
    },
  },
  textLastUpdatedAt: {
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      resolver: getTextLastUpdatedAtFieldResolver("MultiDocuments"),
    },
  },
  deleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      logChanges: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userCanDeleteMultiDocument, "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {},
  },
  currentUserVote: DEFAULT_CURRENT_USER_VOTE_FIELD,
  currentUserExtendedVote: DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD,
  voteCount: defaultVoteCountField('MultiDocuments'),
  baseScore: DEFAULT_BASE_SCORE_FIELD,
  extendedScore: DEFAULT_EXTENDED_SCORE_FIELD,
  score: DEFAULT_SCORE_FIELD,
  inactive: DEFAULT_INACTIVE_FIELD,
  afBaseScore: DEFAULT_AF_BASE_SCORE_FIELD,
  afExtendedScore: DEFAULT_AF_EXTENDED_SCORE_FIELD,
  afVoteCount: DEFAULT_AF_VOTE_COUNT_FIELD,
} satisfies Record<string, NewCollectionFieldSpecification<"MultiDocuments">>;

export default schema;
