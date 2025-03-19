// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import {
  accessFilterMultiple, arrayOfForeignKeysOnCreate,
  generateIdResolverMulti,
  generateIdResolverSingle,
  getDenormalizedCountOfReferencesGetValue
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
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver } from "@/lib/editor/make_editable";
import { userIsSubforumModerator } from "./helpers";
import { currentUserExtendedVoteResolver, currentUserVoteResolver, getAllVotes, getCurrentUserVotes } from "@/lib/make_voteable";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { getToCforTag } from "@/server/tableOfContents";
import { getContributorsFieldResolver } from "@/server/utils/contributorsFieldHelper";
import { captureException } from "@sentry/core";
import { wikiGradeDefinitions } from "./schema";
import { isEAForum, isLW, taggingNamePluralSetting, taggingNameSetting } from "@/lib/instanceSettings";

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
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  description: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: true, normalized: false },
      arguments: "version: String",
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
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  descriptionRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("descriptionRevisions"),
    },
  },
  descriptionVersion: {
    graphql: {
      outputType: "String",
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
      outputType: "JSON",
      canRead: "guests",
      validation: {
        optional: true,
      },
    },
  },
  subforumWelcomeText: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userIsSubforumModerator, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
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
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  subforumWelcomeTextRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("subforumWelcomeTextRevisions"),
    },
  },
  subforumWelcomeTextVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("subforumWelcomeTextVersion"),
    },
  },
  moderationGuidelines: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: [userIsSubforumModerator, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Tags", "moderationGuidelines"),
    },
    form: {
      hidden: true,
      control: "EditorFormComponent",
      order: 50,
      group: () => formGroups.subforumModerationGuidelines,
      form: {
        commentEditor: true,
        commentStyles: true,    
      },
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Tags"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  moderationGuidelines_latest: {
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
  moderationGuidelinesRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("moderationGuidelinesRevisions"),
    },
  },
  moderationGuidelinesVersion: {
    graphql: {
      outputType: "String",
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
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["Tags", "MultiDocuments"],
        getTitle: (t) => t.name,
        onCollision: "newDocumentGetsSuffix",
        includesOldSlugs: true,
      },
      validation: {
        optional: true,
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
      outputType: "[String]",
      canRead: ["guests"],
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
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Is post type",
      hidden: !isEAForum,
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      tooltip: `Rank this ${taggingNameSetting.get()} higher in lists of ${taggingNamePluralSetting.get()}?`,
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
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onUpdate: () => {},
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "TagRels",
        foreignFieldName: "tagId",
        filterFn: (tagRel) => !tagRel.deleted,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      onCreate: ({ currentUser }) => currentUser?._id,
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "[String]",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  charsRemoved: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
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
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "Date",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  lastSubforumCommentAt: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  reviewedByUser: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "reviewedByUserId" }),
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
      outputType: "Int",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "[Comment]",
      canRead: ["guests"],
      arguments: "tagCommentsLimit: Int, maxAgeHours: Int, af: Boolean, tagCommentType: String",
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: [...(isLW ? ['members' as const] : []), 'sunshineRegiment', 'admins'],
      validation: {
        optional: true,
      },
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
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Banner Image",
      tooltip: "Minimum 200x600 px",
      control: "ImageUpload",
      hidden: !isEAForum,
      group: () => formGroups.advancedOptions,
    },
  },
  squareImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Square Image",
      tooltip: "Minimum 200x200 px",
      control: "ImageUpload",
      hidden: !isEAForum,
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
      outputType: "[String]",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      control: 'TagFlagToggleList',
      label: "Flags: ",
      order: 30,
    },
  },
  tagFlags: {
    graphql: {
      outputType: "[TagFlag!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "TagFlags", fieldName: "tagFlagsIds" }),
    },
  },
  lesswrongWikiImportRevision: {
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
  lesswrongWikiImportSlug: {
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
  lesswrongWikiImportCompleted: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  lastVisitedAt: {
    graphql: {
      outputType: "Date",
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
      outputType: "Boolean",
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
      outputType: "JSON",
      canRead: ["guests"],
      arguments: "version: String",
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
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  contributors: {
    graphql: {
      outputType: "TagContributorsList",
      canRead: ["guests"],
      arguments: "limit: Int, version: String",
      resolver: getContributorsFieldResolver({ collectionName: "Tags", fieldName: "description" }),
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
  introSequenceId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Sequences",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  sequence: {
    graphql: {
      outputType: "Sequence",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Sequences", fieldName: "introSequenceId" }),
    },
  },
  postsDefaultSortOrder: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
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
      outputType: "[String]",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  subforumUnreadMessagesCount: {
    graphql: {
      outputType: "Int",
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
      outputType: "[String]",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Subforum Moderators",
      control: "FormUserMultiselect",
      group: () => formGroups.advancedOptions,
    },
  },
  subforumModerators: {
    graphql: {
      outputType: "[User!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "subforumModeratorIds" }),
    },
  },
  subforumIntroPostId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Subforum intro post ID",
      tooltip: "Dismissable intro post that will appear at the top of the subforum feed",
      group: () => formGroups.advancedOptions,
    },
  },
  subforumIntroPost: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "subforumIntroPostId" }),
    },
  },
  parentTagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
    },
    graphql: {
      outputType: "String",
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
      validation: {
        optional: true,
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
      outputType: "Tag",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Tags", fieldName: "parentTagId" }),
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
      outputType: "[String]",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
  },
  subTags: {
    graphql: {
      outputType: "[Tag!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Tags", fieldName: "subTagIds" }),
    },
  },
  autoTagModel: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
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
      outputType: "String",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "No Index",
      tooltip: `Hide this ${taggingNameSetting.get()} from search engines`,
      group: () => formGroups.advancedOptions,
    },
  },
  lenses: {
    graphql: {
      outputType: "[MultiDocument!]!",
      canRead: ["guests"],
      arguments: "lensSlug: String, version: String",
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
      outputType: "[MultiDocument!]!",
      canRead: ["guests"],
      arguments: "lensSlug: String, version: String",
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  summaries: {
    graphql: {
      outputType: "[MultiDocument!]!",
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
      outputType: "Date",
      canRead: ["guests"],
      resolver: getTextLastUpdatedAtFieldResolver("Tags"),
    },
  },
  isArbitalImport: {
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      resolver: (tag) => tag.legacyData?.arbitalPageId !== undefined,
    },
  },
  arbitalLinkedPages: {
    graphql: {
      outputType: "ArbitalLinkedPages",
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
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.advancedOptions,
    },
  },
  maxScore: {
    graphql: {
      outputType: "Int",
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
      outputType: "[UserLikingTag!]!",
      canRead: ["guests"],
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Force Allow T3 Audio",
      control: "checkbox",
      group: () => formGroups.advancedOptions,
    },
  },
  currentUserVote: {
    graphql: {
      outputType: "String",
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
      outputType: "JSON",
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
      outputType: "[Vote]",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        return await getCurrentUserVotes(document, context);
      },
    },
  },
  allVotes: {
    graphql: {
      outputType: "[Vote]",
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
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Tags",
        resyncElastic: false,
      },
      validation: {
        optional: true,
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
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  extendedScore: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  inactive: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
  },
  afBaseScore: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "JSON",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  afVoteCount: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Tags">>;

export default schema;
