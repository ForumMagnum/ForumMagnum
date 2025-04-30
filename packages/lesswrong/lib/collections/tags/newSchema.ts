import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import {
  accessFilterMultiple, arrayOfForeignKeysOnCreate,
  generateIdResolverMulti,
  generateIdResolverSingle,
  getDenormalizedCountOfReferencesGetValue
} from "../../utils/schemaUtils";
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
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from '@/lib/collections/revisions/revisionConstants';
import { userIsSubforumModerator } from "./helpers";
import { DEFAULT_AF_BASE_SCORE_FIELD, DEFAULT_AF_EXTENDED_SCORE_FIELD, DEFAULT_AF_VOTE_COUNT_FIELD, DEFAULT_BASE_SCORE_FIELD, DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD, DEFAULT_CURRENT_USER_VOTE_FIELD, DEFAULT_EXTENDED_SCORE_FIELD, DEFAULT_INACTIVE_FIELD, DEFAULT_SCORE_FIELD, defaultVoteCountField } from "@/lib/make_voteable";
import { getToCforTag } from "@/server/tableOfContents";
import { getContributorsFieldResolver } from "@/lib/collections/helpers/contributorsField";
import { captureException } from "@sentry/core";
import { isEAForum, isLW, taggingNamePluralSetting, taggingNameSetting } from "@/lib/instanceSettings";
import { permissionGroups } from "@/lib/permissions";
import gql from "graphql-tag";
import type { TagCommentType } from "../comments/types";

export const graphqlTypeDefs = gql`
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
`

export const TAG_POSTS_SORT_ORDER_OPTIONS = {
  relevance: { label: preferredHeadingCase("Most Relevant") },
  ...SORT_ORDER_OPTIONS,
} satisfies Record<string, SettingsOption>;


const wikiGradeDefinitions = {
  0: "Uncategorized",
  1: "Flagged",
  2: "Stub",
  3: "C-Class",
  4: "B-Class",
  5: "A-Class"
} satisfies Record<number, string>;

export const wikiGradeOptions = Object.entries(wikiGradeDefinitions).map(([grade, name]) => ({
  value: parseInt(grade),
  label: name,
}));

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
  description: {
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
      editableFieldOptions: { pingbacks: true, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Tags", "description"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
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
      // control: "EditorFormComponent",
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
  description_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
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
      canUpdate: [userIsSubforumModerator, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Tags", "subforumWelcomeText"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
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
      // control: "EditorFormComponent",
      hidden: false,
      group: () => formGroups.subforumWelcomeMessage,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Tags"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  subforumWelcomeText_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  
  moderationGuidelines: {
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
      canUpdate: [userIsSubforumModerator, "sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Tags", "moderationGuidelines"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      hidden: true,
      // control: "EditorFormComponent",
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
  moderationGuidelines_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  
  slug: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["Tags", "MultiDocuments"],
        getTitle: (t) => t.name!,
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
      outputType: "[String!]!",
      inputType: "[String!]",
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
      outputType: "String!",
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Is post type",
      hidden: () => !isEAForum,
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
      outputType: "Float!",
      inputType: "Float",
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
  // number of paragraphs to display above-the-fold
  descriptionTruncationCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
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
        //filterFn: tagRel => tagRel.baseScore > 0, //TODO: Didn't work with filter; votes are bypassing the relevant callback?
        filterFn: tagRel => !tagRel.deleted // TODO: per the above, we still need to make this check baseScore > 0
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
      outputType: "[String!]",
      inputType: "[String!]",
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
      // control: "FormUserMultiselect",
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
    form: {
      hidden: true,
    },
  },
  reviewedByUser: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "reviewedByUserId" }),
    },
  },
  // What grade is the current tag? See the wikiGradeDefinitions variable for details.
  wikiGrade: {
    database: {
      type: "INTEGER",
      defaultValue: 2,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Int!",
      inputType: "Int",
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
      // control: "select",
      group: () => formGroups.advancedOptions,
    },
  },
  recentComments: {
    graphql: {
      outputType: "[Comment]",
      canRead: ["guests"],
      arguments: "tagCommentsLimit: Int, maxAgeHours: Int, af: Boolean, tagCommentType: String",
      resolver: async (tag, args: { tagCommentsLimit?: number|null, maxAgeHours?: number, af?: boolean, tagCommentType?: TagCommentType }, context) => {
        // assuming this might have the same issue as `recentComments` on the posts schema, w.r.t. tagCommentsLimit being null vs. undefined
        const { tagCommentsLimit, maxAgeHours = 18, af = false, tagCommentType = "DISCUSSION" } = args;
        const { currentUser, Comments } = context;

        // `lastCommentTime` can be `null`, which produces <Invalid Date> when passed through moment, rather than the desired Date.now() default
        const lastCommentTime = (tagCommentType === "SUBFORUM" ? tag.lastSubforumCommentAt : tag.lastCommentedAt) ?? undefined;
        const timeCutoff = moment(lastCommentTime).subtract(maxAgeHours, "hours").toDate();
        const comments = await Comments.find({
          ...getDefaultViewSelector("Comments"),
          tagId: tag._id,
          score: { $gt: 0 },
          deletedPublic: false,
          postedAt: { $gt: timeCutoff },
          tagCommentType: tagCommentType,
          ...(af ? { af: true } : {}),
        }, {
          limit: tagCommentsLimit ?? 5,
          sort: { postedAt: -1 },
        }).fetch();
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
  // Cloudinary image id for the banner image (high resolution)
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
      // control: "ImageUpload",
      hidden: () => !isEAForum,
      group: () => formGroups.advancedOptions,
    },
  },
  // Cloudinary image id for the square image which shows up in the all topics page, this will usually be a cropped version of the banner image
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
      // control: "ImageUpload",
      hidden: () => !isEAForum,
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
      outputType: "[String!]!",
      inputType: "[String!]",
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
  // Populated by the LW 1.0 wiki import, with the revision number
  // that has the last full state of the imported post
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
  // lastVisitedAt: If the user is logged in and has viewed this tag, the date
  // they last viewed it. Otherwise, null.
  // RM: in fact we don't currently record ReadStatuses for tags, so this is always null
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
      // control: "select",
      group: () => formGroups.advancedOptions,
    },
  },
  canVoteOnRels: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      outputType: "[String!]",
      inputType: "[String!]",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
        allowedValues: ["userOwns", "userOwnsOnlyUpvote", ...permissionGroups],
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
      outputType: "[String!]!",
      inputType: "[String!]",
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
      // control: "FormUserMultiselect",
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
          // Actually I think this is nonsensical; tags don't have _id until after they're created
          if ((await Tags.find({ parentTagId: (tag as DbTag)._id }).count())) {
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
          if ((await Tags.find({ parentTagId: oldDocument._id }).count())) {
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
      outputType: "[String!]!",
      inputType: "[String!]",
      canRead: ["guests"],
      // To edit this, you have to edit the parent tag of the tag you are adding, and this will be automatically updated. It's like this for
      // largely historical reasons, we didn't used to materialise the sub tag ids at all, but this had performance issues
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
        const multiDocuments = await MultiDocuments.find({
          parentDocumentId: tag._id,
          collectionName: "Tags",
          fieldName: "description",
          deleted: false,
        }, { sort: { index: 1 } }).fetch();

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
                { documentId: versionedLensId, version },
                { _id: { $in: nonVersionedLensRevisionIds } }
              ],
            };

            revisions = await Revisions.find(selector).fetch();
          }
        }
        if (!revisions) {
          const revisionIds = multiDocuments.map((md) => md.contents_latest);
          revisions = await Revisions.find({ _id: { $in: revisionIds } }).fetch();
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
        const multiDocuments = await MultiDocuments.find({
          parentDocumentId: tag._id,
          collectionName: "Tags",
          fieldName: "description",
        }, { sort: { index: 1 } }).fetch();

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
                { documentId: versionedLensId, version },
                { _id: { $in: nonVersionedLensRevisionIds } },
              ],
            };
            revisions = await Revisions.find(selector).fetch();
          }
        }

        if (!revisions) {
          const revisionIds = multiDocuments.map((md) => md.contents_latest);
          revisions = await Revisions.find({ _id: { $in: revisionIds } }).fetch();
        
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
  /**
   * Placeholder pages are pages that have been linked to, but haven't properly
   * been created. This is the same as Arbital redlinks. They semi-exist as
   * wiki pages so that they can have pingbacks (which are used to see how many
   * pages are linking to them), and so you can vote on creating them.
   */
  isPlaceholderPage: {
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
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  summaries: {
    graphql: {
      outputType: "[MultiDocument!]!",
      inputType: "[MultiDocument!]",
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
  currentUserVote: DEFAULT_CURRENT_USER_VOTE_FIELD,
  currentUserExtendedVote: DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD,
  voteCount: defaultVoteCountField('Tags'),
  baseScore: DEFAULT_BASE_SCORE_FIELD,
  extendedScore: DEFAULT_EXTENDED_SCORE_FIELD,
  score: DEFAULT_SCORE_FIELD,
  inactive: DEFAULT_INACTIVE_FIELD,
  afBaseScore: DEFAULT_AF_BASE_SCORE_FIELD,
  afExtendedScore: DEFAULT_AF_EXTENDED_SCORE_FIELD,
  afVoteCount: DEFAULT_AF_VOTE_COUNT_FIELD,
} satisfies Record<string, CollectionFieldSpecification<"Tags">>;

export default schema;
