// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import {
    accessFilterSingle, generateIdResolverSingle,
    getDenormalizedCountOfReferencesGetValue,
    getFillIfMissing,
    throwIfSetToNull
} from "@/lib/utils/schemaUtils";
import { getTextLastUpdatedAtFieldResolver } from "../helpers/textLastUpdatedAtField";
import { getArbitalLinkedPagesFieldResolver } from "../helpers/arbitalLinkedPagesField";
import { getSummariesFieldResolver, getSummariesFieldSqlResolver } from "../helpers/summariesField";
import { formGroups } from "./formGroups";
import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import { defaultEditorPlaceholder, getNormalizedEditableResolver, getNormalizedEditableSqlResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { currentUserExtendedVoteResolver, currentUserVoteResolver, getAllVotes, getCurrentUserVotes } from "@/lib/make_voteable";
import { getToCforMultiDocument } from "@/server/tableOfContents";
import { getContributorsFieldResolver } from "@/server/utils/contributorsFieldHelper";

const MULTI_DOCUMENT_DELETION_WINDOW = 1000 * 60 * 60 * 24 * 7;

export function userCanDeleteMultiDocument(user: DbUser | UsersCurrent | null, document: DbMultiDocument) {
  if (userIsAdminOrMod(user)) {
    return true;
  }

  const deletableUntil = new Date(document.createdAt).getTime() + MULTI_DOCUMENT_DELETION_WINDOW;
  const withinDeletionWindow = deletableUntil > Date.now();

  return userOwns(user, document) && withinDeletionWindow;
}

const schema: Record<string, NewCollectionFieldSpecification<"MultiDocuments">> = {
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
      canRead: ["guests"],
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
      resolver: getNormalizedEditableResolver("contents"),
      sqlResolver: getNormalizedEditableSqlResolver("contents"),
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
  pingbacks: {
    database: {
      type: "JSONB",
      denormalized: true,
    },
    graphql: {
      type: "JSON",
      canRead: "guests",
    },
  },
  slug: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["Tags", "MultiDocuments"],
        getTitle: (md) => md.title ?? md.tabTitle,
        onCollision: "rejectNewDocument",
        includesOldSlugs: true,
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
      type: "[String]",
      canRead: ["guests"],
      onCreate: getFillIfMissing([]),
      onUpdate: throwIfSetToNull,
    },
  },
  title: {
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
  preview: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  tabTitle: {
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
      order: 10,
    },
  },
  tabSubtitle: {
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
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      onCreate: ({ currentUser }) => currentUser._id,
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "MultiDocuments", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  parentDocumentId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  parentTag: {
    graphql: {
      type: "Tag",
      canRead: ["guests"],
      resolver: async (multiDocument, _, context) => {
        const { loaders, currentUser, Tags } = context;
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
      type: "MultiDocument",
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
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["Tags", "MultiDocuments"],
      },
    },
  },
  fieldName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["description", "summary"],
      },
    },
  },
  index: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["members"],
      onCreate: async ({ newDocument, context }) => {
        const { MultiDocuments } = context;
        const { parentDocumentId } = newDocument;
        const otherSummaries = await MultiDocuments.find(
          {
            parentDocumentId,
            fieldName: newDocument.fieldName,
          },
          undefined,
          {
            index: 1,
          }
        ).fetch();
        const otherSummaryIndexes = otherSummaries.map((summary) => summary.index);
        const newIndex = otherSummaryIndexes.length > 0 ? Math.max(...otherSummaryIndexes) + 1 : 0;
        return newIndex;
      },
    },
  },
  tableOfContents: {
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      resolver: async (document, { version }, context) => {
        return await getToCforMultiDocument({
          document,
          version,
          context,
        });
      },
    },
  },
  contributors: {
    graphql: {
      type: "TagContributorsList",
      canRead: ["guests"],
      resolver: getContributorsFieldResolver({ collectionName: "MultiDocuments", fieldName: "contents" }),
    },
  },
  contributionStats: {
    database: {
      type: "JSONB",
      denormalized: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
    },
  },
  arbitalLinkedPages: {
    graphql: {
      type: "ArbitalLinkedPages",
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
      type: "String",
      canRead: ["guests"],
    },
  },
  summaries: {
    graphql: {
      type: "[MultiDocument!]!",
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
      type: "Date",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userCanDeleteMultiDocument, "sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  currentUserVote: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const votes = await getCurrentUserVotes(document, context);
        if (!votes.length) return null;
        return votes[0].voteType ?? null;
      },
      sqlResolver: currentUserVoteResolver,
    },
  },
  currentUserExtendedVote: {
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const votes = await getCurrentUserVotes(document, context);
        if (!votes.length) return null;
        return votes[0].extendedVoteType || null;
      },
      sqlResolver: currentUserExtendedVoteResolver,
    },
  },
  currentUserVotes: {
    graphql: {
      type: "[Vote]",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        return await getCurrentUserVotes(document, context);
      },
    },
  },
  allVotes: {
    graphql: {
      type: "[Vote]",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const { currentUser } = context;
        if (userIsAdminOrMod(currentUser)) {
          return await getAllVotes(document, context);
        } else {
          return await getCurrentUserVotes(document, context);
        }
      },
    },
  },
  voteCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "MultiDocuments",
        fieldName: "voteCount",
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "MultiDocuments",
      }),
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "MultiDocuments",
        resyncElastic: false,
      },
    },
  },
  baseScore: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(0),
      onUpdate: throwIfSetToNull,
    },
  },
  extendedScore: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
    },
  },
  score: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(0),
      onUpdate: throwIfSetToNull,
    },
  },
  inactive: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  afBaseScore: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
    },
    form: {
      label: "Alignment Base Score",
    },
  },
  afExtendedScore: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
    },
  },
  afVoteCount: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
    },
  },
};

export default schema;
