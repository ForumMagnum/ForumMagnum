// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import {
    accessFilterMultiple, arrayOfForeignKeysOnCreate,
    generateIdResolverMulti,
    generateIdResolverSingle,
    getDenormalizedCountOfReferencesGetValue,
    getFillIfMissing,
    throwIfSetToNull
} from "../../utils/schemaUtils";
import { addGraphQLSchema } from "../../vulcan-lib/graphql";
import { getWithLoader } from "../../loaders";
import moment from "moment";
import { SORT_ORDER_OPTIONS, SettingsOption } from "../posts/dropdownOptions";
import { formGroups } from "./formGroups";
import { getDefaultViewSelector } from "../../utils/viewUtils";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import { getArbitalLinkedPagesFieldResolver } from "../helpers/arbitalLinkedPagesField";
import { getSummariesFieldResolver, getSummariesFieldSqlResolver } from "../helpers/summariesField";
import { getTextLastUpdatedAtFieldResolver } from "../helpers/textLastUpdatedAtField";
import uniqBy from "lodash/uniqBy";
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { userIsSubforumModerator } from "./helpers";
import { currentUserExtendedVoteResolver, currentUserVoteResolver, getAllVotes, getCurrentUserVotes } from "@/lib/make_voteable";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { getToCforTag } from "@/server/tableOfContents";
import { getContributorsFieldResolver } from "@/server/utils/contributorsFieldHelper";
import { captureException } from "@sentry/core";
import { wikiGradeDefinitions } from "./schema";

addGraphQLSchema(`
  type TagContributor {
    user: User
    contributionScore: Int!
    currentAttributionCharCount: Int
    numCommits: Int!
    voteCount: Int!
  }
  type TagContributorsList {
    contributors: [TagContributor!]
    totalCount: Int!
  }
  type UserLikingTag {
    _id: String!
    displayName: String!
  }
`);

export const TAG_POSTS_SORT_ORDER_OPTIONS: Record<string, SettingsOption> = {
  relevance: { label: preferredHeadingCase("Most Relevant") },
  ...SORT_ORDER_OPTIONS,
};

// Define the helper function at an appropriate place in your file
async function getTagMultiDocuments(context: ResolverContext, tagId: string) {
  const { MultiDocuments } = context;
  return await getWithLoader(
    context,
    MultiDocuments,
    "multiDocumentsForTag",
    { collectionName: "Tags", fieldName: "description" },
    "parentDocumentId",
    tagId
  );
}

const schema: Record<string, NewCollectionFieldSpecification<"Tags">> = {
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
  description: {
    graphql: {
      type: "Revision",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Tags", "description"),
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "description",
        collectionName: "Tags",
        commentEditor: false,
        commentStyles: true,
        hideControls: false,
      },
      order: 10,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (tag, name) => {
          if (tag._id) {
            return {
              id: `tag:${tag._id}`,
              verify: true,
            };
          }
          return {
            id: `tag:create`,
            verify: true,
          };
        },
        revisionsHaveCommitMessages: true,
      },
    },
  },
  description_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  descriptionRevisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("descriptionRevisions"),
    },
  },
  descriptionVersion: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("descriptionVersion"),
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
  subforumWelcomeText: {
    graphql: {
      type: "Revision",
      canRead: ["guests"],
      canUpdate: [userIsSubforumModerator, "sunshineRegiment", "admins"],
      canCreate: [userIsSubforumModerator, "sunshineRegiment", "admins"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Tags", "subforumWelcomeText"),
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "subforumWelcomeText",
        collectionName: "Tags",
        commentEditor: false,
        commentStyles: false,
        hideControls: false,
      },
      order: 0,
      control: "EditorFormComponent",
      hidden: false,
      group: () => formGroups.subforumWelcomeMessage,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Tags"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  subforumWelcomeText_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  subforumWelcomeTextRevisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("subforumWelcomeTextRevisions"),
    },
  },
  subforumWelcomeTextVersion: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("subforumWelcomeTextVersion"),
    },
  },
  moderationGuidelines: {
    graphql: {
      type: "Revision",
      canRead: ["guests"],
      canUpdate: [userIsSubforumModerator, "sunshineRegiment", "admins"],
      canCreate: [userIsSubforumModerator, "sunshineRegiment", "admins"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Tags", "moderationGuidelines"),
    },
  },
  moderationGuidelines_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  moderationGuidelinesRevisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("moderationGuidelinesRevisions"),
    },
  },
  moderationGuidelinesVersion: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("moderationGuidelinesVersion"),
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
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["Tags", "MultiDocuments"],
        getTitle: (t) => t.name,
        onCollision: "newDocumentGetsSuffix",
        includesOldSlugs: true,
      },
    },
    form: {
      group: () => formGroups.advancedOptions,
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
  name: {
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
      order: 1,
    },
  },
  shortName: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  subtitle: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  core: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Core Tag (moderators check whether it applies when reviewing new posts)",
      group: () => formGroups.advancedOptions,
    },
  },
  isPostType: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Is post type",
      hidden: false,
      group: () => formGroups.advancedOptions,
    },
  },
  suggestedAsFilter: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Suggested Filter (appears as a default option in filter settings without having to use the search box)",
      group: () => formGroups.advancedOptions,
    },
  },
  defaultOrder: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(0),
      onUpdate: throwIfSetToNull,
    },
    form: {
      tooltip: "Rank this wikitag higher in lists of wikitags?",
      group: () => formGroups.advancedOptions,
    },
  },
  descriptionTruncationCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(0),
      onUpdate: () => {},
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  postCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Tags",
        fieldName: "postCount",
        foreignCollectionName: "TagRels",
        foreignFieldName: "tagId",
        filterFn: (tagRel) => !tagRel.deleted,
      }),
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "TagRels",
        foreignFieldName: "tagId",
        filterFn: (tagRel) => !tagRel.deleted,
        resyncElastic: false,
      },
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      onCreate: ({ currentUser }) => currentUser._id,
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Tags", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  adminOnly: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Admin Only",
      group: () => formGroups.advancedOptions,
    },
  },
  canEditUserIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {
      label: "Restrict to these authors",
      tooltip: "Only these authors will be able to edit the topic",
      control: "FormUserMultiselect",
      group: () => formGroups.advancedOptions,
    },
  },
  charsAdded: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
    },
  },
  charsRemoved: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
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
      canUpdate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  lastCommentedAt: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
    },
  },
  lastSubforumCommentAt: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
    },
  },
  needsReview: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  reviewedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  reviewedByUser: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Tags", fieldName: "reviewedByUserId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  wikiGrade: {
    database: {
      type: "INTEGER",
      defaultValue: 2,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Int",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(2),
      onUpdate: throwIfSetToNull,
    },
    form: {
      options: () =>
        Object.entries(wikiGradeDefinitions).map(([grade, name]) => ({
          value: parseInt(grade),
          label: name,
        })),
      control: "select",
      group: () => formGroups.advancedOptions,
    },
  },
  recentComments: {
    graphql: {
      type: "[Comment]",
      canRead: ["guests"],
      resolver: async (tag, args, context) => {
        // assuming this might have the same issue as `recentComments` on the posts schema, w.r.t. tagCommentsLimit being null vs. undefined
        const { tagCommentsLimit, maxAgeHours = 18, af = false, tagCommentType = "DISCUSSION" } = args;
        const { currentUser, Comments } = context;
        // `lastCommentTime` can be `null`, which produces <Invalid Date> when passed through moment, rather than the desired Date.now() default
        const lastCommentTime =
          (tagCommentType === "SUBFORUM" ? tag.lastSubforumCommentAt : tag.lastCommentedAt) ?? undefined;
        const timeCutoff = moment(lastCommentTime).subtract(maxAgeHours, "hours").toDate();
        const comments = await Comments.find(
          {
            ...getDefaultViewSelector("Comments"),
            tagId: tag._id,
            score: {
              $gt: 0,
            },
            deletedPublic: false,
            postedAt: {
              $gt: timeCutoff,
            },
            tagCommentType: tagCommentType,
            ...(af
              ? {
                  af: true,
                }
              : {}),
          },
          {
            limit: tagCommentsLimit ?? 5,
            sort: {
              postedAt: -1,
            },
          }
        ).fetch();
        return await accessFilterMultiple(currentUser, "Comments", comments, context);
      },
    },
  },
  wikiOnly: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  bannerImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      label: "Banner Image",
      tooltip: "Minimum 200x600 px",
      control: "ImageUpload",
      hidden: false,
      group: () => formGroups.advancedOptions,
    },
  },
  squareImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      label: "Square Image",
      tooltip: "Minimum 200x200 px",
      control: "ImageUpload",
      hidden: false,
      group: () => formGroups.advancedOptions,
    },
  },
  tagFlagsIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  tagFlags: {
    graphql: {
      type: "[TagFlag!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Tags", fieldName: "tagFlagsIds" }),
    },
    form: {
      hidden: true,
    },
  },
  lesswrongWikiImportRevision: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  lesswrongWikiImportSlug: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  lesswrongWikiImportCompleted: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
    },
  },
  lastVisitedAt: {
    graphql: {
      type: "Date",
      canRead: ["guests"],
      resolver: async (tag, args, context) => {
        const { ReadStatuses, currentUser } = context;
        if (!currentUser) return null;
        const readStatus = await getWithLoader(
          context,
          ReadStatuses,
          `tagReadStatuses`,
          {
            userId: currentUser._id,
          },
          "tagId",
          tag._id
        );
        if (!readStatus.length) return null;
        return readStatus[0].lastUpdated;
      },
    },
  },
  isRead: {
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      resolver: async (tag, args, context) => {
        const { ReadStatuses, currentUser } = context;
        if (!currentUser) return false;
        const readStatus = await getWithLoader(
          context,
          ReadStatuses,
          `tagReadStatuses`,
          {
            userId: currentUser._id,
          },
          "tagId",
          tag._id
        );
        if (!readStatus.length) return false;
        return readStatus[0].isRead;
      },
      sqlResolver: ({ field, currentUserField, join }) =>
        join({
          table: "ReadStatuses",
          type: "left",
          on: {
            tagId: field("_id"),
            userId: currentUserField("_id"),
          },
          resolver: (readStatusField) => `COALESCE(${readStatusField("isRead")}, FALSE)`,
        }),
    },
  },
  tableOfContents: {
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        try {
          return await getToCforTag({
            document,
            version: args.version || null,
            context,
          });
        } catch (e) {
          captureException(e);
          return null;
        }
      },
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
  contributors: {
    graphql: {
      type: "TagContributorsList",
      canRead: ["guests"],
      resolver: getContributorsFieldResolver({ collectionName: "Tags", fieldName: "description" }),
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
  introSequenceId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Sequences",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  sequence: {
    graphql: {
      type: "Sequence",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Tags", fieldName: "introSequenceId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  postsDefaultSortOrder: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {
      options: () =>
        Object.entries(TAG_POSTS_SORT_ORDER_OPTIONS).map(([key, val]) => ({
          value: key,
          label: val.label,
        })),
      control: "select",
      group: () => formGroups.advancedOptions,
    },
  },
  canVoteOnRels: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  isSubforum: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  subforumUnreadMessagesCount: {
    graphql: {
      type: "Int",
      canRead: ["guests"],
      resolver: async (tag, args, context) => {
        if (!tag.isSubforum) return null;
        const { Comments, UserTagRels, currentUser } = context;
        const userTagRel = currentUser
          ? await UserTagRels.findOne({
              userId: currentUser._id,
              tagId: tag._id,
            })
          : null;
        // This is when this field was added, so assume all messages before then have been read
        const earliestDate = new Date("2022-09-30T15:07:34.026Z");
        if (!userTagRel) {
          return await Comments.find({
            tagId: tag._id,
            tagCommentType: "SUBFORUM",
            deleted: {
              $ne: true,
            },
            postedAt: {
              $gt: earliestDate,
            },
          }).count();
        }
        if (!userTagRel?.subforumShowUnreadInSidebar) return null;
        const userLastVisitedAt = userTagRel?.subforumLastVisitedAt || earliestDate;
        const count = await Comments.find({
          tagId: tag._id,
          tagCommentType: "SUBFORUM",
          deleted: {
            $ne: true,
          },
          postedAt: {
            $gt: userLastVisitedAt,
          },
        }).count();
        return count;
      },
    },
  },
  subforumModeratorIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
    form: {
      label: "Subforum Moderators",
      control: "FormUserMultiselect",
      group: () => formGroups.advancedOptions,
    },
  },
  subforumModerators: {
    graphql: {
      type: "[User!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Tags", fieldName: "subforumModeratorIds" }),
    },
    form: {
      hidden: true,
    },
  },
  subforumIntroPostId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {
      label: "Subforum intro post ID",
      tooltip: "Dismissable intro post that will appear at the top of the subforum feed",
      group: () => formGroups.advancedOptions,
    },
  },
  subforumIntroPost: {
    graphql: {
      type: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Tags", fieldName: "subforumIntroPostId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  parentTagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: async ({ newDocument: tag, context }) => {
        if (tag.parentTagId) {
          // don't allow chained parent tag relationships
          const { Tags } = context;
          if (
            await Tags.find({
              parentTagId: tag._id,
            }).count()
          ) {
            throw Error(`Tag ${tag.name} is a parent tag of another tag.`);
          }
        }
        return tag.parentTagId;
      },
      onUpdate: async ({ data, oldDocument, context }) => {
        if (data.parentTagId) {
          if (data.parentTagId === oldDocument._id) {
            throw Error(`Can't set self as parent tag.`);
          }
          const { Tags } = context;
          // don't allow chained parent tag relationships
          if (
            await Tags.find({
              parentTagId: oldDocument._id,
            }).count()
          ) {
            throw Error(`Tag ${oldDocument.name} is a parent tag of another tag.`);
          }
        }
        return data.parentTagId;
      },
    },
    form: {
      label: "Parent Tag",
      tooltip: "Parent tag which will also be applied whenever this tag is applied to a post for the first time",
      control: "TagSelect",
      group: () => formGroups.advancedOptions,
    },
  },
  parentTag: {
    graphql: {
      type: "Tag",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Tags", fieldName: "parentTagId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  subTagIds: {
    database: {
      type: "VARCHAR(27)[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  subTags: {
    graphql: {
      type: "[Tag!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Tags", fieldName: "subTagIds" }),
    },
    form: {
      hidden: true,
    },
  },
  autoTagModel: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      label: "Auto-tag classifier model ID",
      group: () => formGroups.advancedOptions,
    },
  },
  autoTagPrompt: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      label: "Auto-tag classifier prompt string",
      group: () => formGroups.advancedOptions,
    },
  },
  noindex: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "No Index",
      tooltip: "Hide this wikitag from search engines",
      group: () => formGroups.advancedOptions,
    },
  },
  lenses: {
    graphql: {
      type: "[MultiDocument!]!",
      canRead: ["guests"],
      resolver: async (tag, { lensSlug, version }, context) => {
        const { MultiDocuments, Revisions } = context;
        const multiDocuments = await MultiDocuments.find(
          {
            parentDocumentId: tag._id,
            collectionName: "Tags",
            fieldName: "description",
            deleted: false,
          },
          {
            sort: {
              index: 1,
            },
          }
        ).fetch();
        let revisions;
        if (version && lensSlug) {
          // Find the MultiDocument with the matching slug or oldSlug
          const versionedLens = multiDocuments.find(
            (md) => md.slug === lensSlug || (md.oldSlugs && md.oldSlugs.includes(lensSlug))
          );
          if (versionedLens) {
            const versionedLensId = versionedLens._id;
            const nonVersionedLensRevisionIds = multiDocuments
              .filter((md) => md._id !== versionedLensId)
              .map((md) => md.contents_latest);
            const selector = {
              $or: [
                {
                  documentId: versionedLensId,
                  version,
                },
                {
                  _id: {
                    $in: nonVersionedLensRevisionIds,
                  },
                },
              ],
            };
            revisions = await Revisions.find(selector).fetch();
          }
        }
        if (!revisions) {
          const revisionIds = multiDocuments.map((md) => md.contents_latest);
          revisions = await Revisions.find({
            _id: {
              $in: revisionIds,
            },
          }).fetch();
        }
        const revisionsById = new Map(revisions.map((rev) => [rev.documentId || rev._id, rev]));
        const unfilteredResults = multiDocuments.map((md) => ({
          ...md,
          contents: revisionsById.get(md._id),
        }));
        return await accessFilterMultiple(context.currentUser, "MultiDocuments", unfilteredResults, context);
      },
      sqlResolver: ({ field, resolverArg }) => {
        return `(
        SELECT ARRAY_AGG(
          JSONB_SET(
            TO_JSONB(md.*),
            '{contents}'::TEXT[],
            TO_JSONB(r.*),
            true
          )
          ORDER BY md."index" ASC
        ) AS contents
        FROM "MultiDocuments" md
        LEFT JOIN "Revisions" r
          ON r._id = CASE
            WHEN (
              md.slug = ${resolverArg("lensSlug")}::TEXT OR
              ( md."oldSlugs" IS NOT NULL AND
                ${resolverArg("lensSlug")}::TEXT = ANY (md."oldSlugs")
              )
            ) AND ${resolverArg("version")}::TEXT IS NOT NULL THEN (
              SELECT r._id FROM "Revisions" r
              WHERE r."documentId" = md._id 
              AND r.version = ${resolverArg("version")}::TEXT 
              LIMIT 1
            )
            ELSE md.contents_latest
          END
        WHERE md."parentDocumentId" = ${field("_id")}
          AND md."collectionName" = 'Tags'
          AND md."fieldName" = 'description'
          AND md."deleted" IS FALSE
          LIMIT 1
      )`;
      },
    },
  },
  lensesIncludingDeleted: {
    graphql: {
      type: "[MultiDocument!]!",
      canRead: ["guests"],
      resolver: async (tag, { lensSlug, version }, context) => {
        const { MultiDocuments, Revisions } = context;
        const multiDocuments = await MultiDocuments.find(
          {
            parentDocumentId: tag._id,
            collectionName: "Tags",
            fieldName: "description",
          },
          {
            sort: {
              index: 1,
            },
          }
        ).fetch();
        let revisions;
        if (version && lensSlug) {
          // Find the MultiDocument with the matching slug or oldSlug
          const versionedLens = multiDocuments.find(
            (md) => md.slug === lensSlug || (md.oldSlugs && md.oldSlugs.includes(lensSlug))
          );
          if (versionedLens) {
            const versionedLensId = versionedLens._id;
            const nonVersionedLensRevisionIds = multiDocuments
              .filter((md) => md._id !== versionedLensId)
              .map((md) => md.contents_latest);
            const selector = {
              $or: [
                {
                  documentId: versionedLensId,
                  version,
                },
                {
                  _id: {
                    $in: nonVersionedLensRevisionIds,
                  },
                },
              ],
            };
            revisions = await Revisions.find(selector).fetch();
          }
        }
        if (!revisions) {
          const revisionIds = multiDocuments.map((md) => md.contents_latest);
          revisions = await Revisions.find({
            _id: {
              $in: revisionIds,
            },
          }).fetch();
        }
        const revisionsById = new Map(revisions.map((rev) => [rev.documentId || rev._id, rev]));
        const unfilteredResults = multiDocuments.map((md) => ({
          ...md,
          contents: revisionsById.get(md._id),
        }));
        return await accessFilterMultiple(context.currentUser, "MultiDocuments", unfilteredResults, context);
      },
      sqlResolver: ({ field, resolverArg }) => {
        return `(
        SELECT ARRAY_AGG(
          JSONB_SET(
            TO_JSONB(md.*),
            '{contents}'::TEXT[],
            TO_JSONB(r.*),
            true
          )
          ORDER BY md."index" ASC
        ) AS contents
        FROM "MultiDocuments" md
        LEFT JOIN "Revisions" r
          ON r._id = CASE
            WHEN (
              md.slug = ${resolverArg("lensSlug")}::TEXT OR
              ( md."oldSlugs" IS NOT NULL AND
                ${resolverArg("lensSlug")}::TEXT = ANY (md."oldSlugs")
              )
            ) AND ${resolverArg("version")}::TEXT IS NOT NULL THEN (
              SELECT r._id FROM "Revisions" r
              WHERE r."documentId" = md._id 
              AND r.version = ${resolverArg("version")}::TEXT 
              LIMIT 1
            )
            ELSE md.contents_latest
          END
        WHERE md."parentDocumentId" = ${field("_id")}
          AND md."collectionName" = 'Tags'
          AND md."fieldName" = 'description'
          LIMIT 1
      )`;
      },
    },
  },
  isPlaceholderPage: {
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
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  summaries: {
    graphql: {
      type: "[MultiDocument!]!",
      canRead: ["guests"],
      resolver: getSummariesFieldResolver("Tags"),
      sqlResolver: getSummariesFieldSqlResolver("Tags"),
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
      resolver: getTextLastUpdatedAtFieldResolver("Tags"),
    },
  },
  isArbitalImport: {
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      resolver: (tag) => tag.legacyData?.arbitalPageId !== undefined,
    },
  },
  arbitalLinkedPages: {
    graphql: {
      type: "ArbitalLinkedPages",
      canRead: ["guests"],
      resolver: getArbitalLinkedPagesFieldResolver({ collectionName: "Tags" }),
    },
  },
  coreTagId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  maxScore: {
    graphql: {
      type: "Int",
      canRead: ["guests"],
      resolver: async (tag, args, context) => {
        const multiDocuments = await getTagMultiDocuments(context, tag._id);
        const tagScore = tag.baseScore ?? 0;
        const multiDocScores = multiDocuments.map((md) => md.baseScore ?? 0);
        const allScores = [tagScore, ...multiDocScores];
        const maxScore = Math.max(...allScores);
        return maxScore;
      },
    },
  },
  usersWhoLiked: {
    graphql: {
      type: "[UserLikingTag!]!",
      canRead: ["guests"],
      validation: {
        simpleSchema: FILL_THIS_IN,
      },
      resolver: async (tag, args, context) => {
        const multiDocuments = await getTagMultiDocuments(context, tag._id);
        const tagUsersWhoLiked = tag.extendedScore?.usersWhoLiked ?? [];
        const multiDocUsersWhoLiked = multiDocuments.flatMap((md) => md.extendedScore?.usersWhoLiked ?? []);
        const usersWhoLiked = uniqBy(tagUsersWhoLiked.concat(multiDocUsersWhoLiked), "_id");
        return usersWhoLiked;
      },
    },
  },
  forceAllowType3Audio: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Force Allow T3 Audio",
      control: "checkbox",
      group: () => formGroups.adminOptions,
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
        collectionName: "Tags",
        fieldName: "voteCount",
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Tags",
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
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Tags",
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
