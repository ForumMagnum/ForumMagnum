import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { documentIsNotDeleted, userIsAdminOrMod, userOwns } from "../../vulcan-users/permissions";
import {
  arrayOfForeignKeysOnCreate,
  generateIdResolverMulti,
  generateIdResolverSingle,
  getDenormalizedCountOfReferencesGetValue,
  getDenormalizedFieldOnCreate,
  getDenormalizedFieldOnUpdate
} from "../../utils/schemaUtils";
import { userGetDisplayNameById } from "../../vulcan-users/helpers";
import { isAF, isEAForum, isLWorAF } from "../../instanceSettings";
import { commentAllowTitle, commentGetPageUrlFromDB } from "./helpers";
import { getVotingSystemNameForDocument } from "../../voting/getVotingSystem";
import { viewTermsToQuery } from "../../utils/viewUtils";
import { quickTakesTagsEnabledSetting } from "../../publicSettings";
import { ForumEventCommentMetadataSchema } from "../forumEvents/types";
import { getDenormalizedEditableResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { isFriendlyUI } from "@/themes/forumTheme";
import { DEFAULT_AF_BASE_SCORE_FIELD, DEFAULT_AF_EXTENDED_SCORE_FIELD, DEFAULT_AF_VOTE_COUNT_FIELD, DEFAULT_BASE_SCORE_FIELD, DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD, DEFAULT_CURRENT_USER_VOTE_FIELD, DEFAULT_EXTENDED_SCORE_FIELD, DEFAULT_INACTIVE_FIELD, DEFAULT_SCORE_FIELD, defaultVoteCountField, getAllVotes, getCurrentUserVotes } from "@/lib/make_voteable";
import { customBaseScoreReadAccess } from "./voting";
import { PostsDetails } from "@/lib/generated/gql-codegen/graphql";
import { CommentsViews } from "./views";

export const moderationOptionsGroup: FormGroupType<"Comments"> = {
  order: 50,
  name: "moderation",
  label: "Moderator Options",
  startCollapsed: true,
};

export const alignmentOptionsGroup = {
  order: 50,
  name: "alignment",
  label: "Alignment Options",
  startCollapsed: true,
};

function isCommentOnPost(data: Partial<DbComment> | CreateCommentDataInput | UpdateCommentDataInput) {
  return "postId" in data;
}

async function isParentPostShortform(comment: DbComment, context: ResolverContext) {
  if (!comment.postId) return false;
  const post = await context.Posts.findOne({
    _id: comment.postId,
  });
  if (!post) return false;
  return !!post.shortform;
}

async function isParentPostKarmaHidden(comment: DbComment, context: ResolverContext) {
  if (!comment.postId) return false;
  const post = await context.Posts.findOne({
    _id: comment.postId,
  });
  if (!post) return false;
  return !!post.hideCommentKarma;
};

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: {
    database: DEFAULT_CREATED_AT_FIELD.database,
    graphql: {
      ...DEFAULT_CREATED_AT_FIELD.graphql,
      outputType: "Date",
      canRead: ["admins"],
    },
  },
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
      editableFieldOptions: { pingbacks: true, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Comments", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => (isFriendlyUI ? "Write a new comment..." : undefined),
        fieldName: "contents",
        collectionName: "Comments",
        commentEditor: true,
        commentStyles: true,
        hideControls: false,
      },
      order: 25,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (comment, name) => {
          if (comment._id) {
            return {
              id: comment._id,
              verify: true,
            };
          }
          if (comment.parentCommentId) {
            return {
              id: "parent:" + comment.parentCommentId,
              verify: false,
            };
          }
          return {
            id: "post:" + comment.postId,
            verify: false,
          };
        },
        revisionsHaveCommitMessages: false,
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
  parentCommentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  parentComment: {
    graphql: {
      outputType: "Comment",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Comments", fieldName: "parentCommentId" }),
    },
  },
  topLevelCommentId: {
    database: {
      type: "VARCHAR(27)",
      denormalized: true,
      foreignKey: "Comments",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  topLevelComment: {
    graphql: {
      outputType: "Comment",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Comments", fieldName: "topLevelCommentId" }),
    },
  },
  postedAt: DEFAULT_CREATED_AT_FIELD,
  lastEditedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      onUpdate: ({ oldDocument, newDocument }) => {
        if (oldDocument.contents?.html !== newDocument.contents?.html) {
          return new Date();
        }
      },
      validation: {
        optional: true,
      },
    },
  },
  author: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      onCreate: async ({ document, context }) => {
        // if userId is changing, change the author name too
        if (document.userId) {
          return await userGetDisplayNameById(document.userId, context);
        }
      },
      onUpdate: async ({ modifier, context }) => {
        // if userId is changing, change the author name too
        if (modifier.$set && modifier.$set.userId) {
          return await userGetDisplayNameById(modifier.$set.userId, context);
        }
      },
      validation: {
        optional: true,
      },
    },
  },
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
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
  tagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  tag: {
    graphql: {
      outputType: "Tag",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Tags", fieldName: "tagId" }),
    },
  },
  forumEventId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ForumEvents",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  forumEvent: {
    graphql: {
      outputType: "ForumEvent",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "ForumEvents", fieldName: "forumEventId" }),
    },
  },
  /**
   * Extra data regarding how this comment relates to the `forumEventId`. Currently
   * this is used for "STICKERS" events, to trigger the creation of a sticker on the
   * frontpage banner as a side effect.
   */
  forumEventMetadata: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        simpleSchema: ForumEventCommentMetadataSchema,
        optional: true,
        blackbox: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  tagCommentType: {
    database: {
      type: "TEXT",
      defaultValue: "DISCUSSION",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["SUBFORUM", "DISCUSSION"],
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  subforumStickyPriority: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
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
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [isEAForum ? documentIsNotDeleted : "guests"],
      canCreate: ["members"],
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
      canRead: [isEAForum ? documentIsNotDeleted : "guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  userIP: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  userAgent: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  referrer: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  authorIsUnreviewed: {
    database: {
      type: "BOOL",
      defaultValue: false,
      denormalized: true,
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
      hidden: true,
    },
  },
  pageUrl: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: async (comment, args, context) => {
        return await commentGetPageUrlFromDB(comment, context, true);
      },
    },
  },
  pageUrlRelative: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: async (comment, args, context) => {
        return await commentGetPageUrlFromDB(comment, context, false);
      },
    },
  },
  answer: {
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  parentAnswerId: {
    database: {
      type: "VARCHAR(27)",
      denormalized: true,
      foreignKey: "Comments",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  parentAnswer: {
    graphql: {
      outputType: "Comment",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Comments", fieldName: "parentAnswerId" }),
    },
  },
  directChildrenCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Comments",
        fieldName: "directChildrenCount",
        foreignCollectionName: "Comments",
        foreignFieldName: "parentCommentId",
        filterFn: (comment) => !comment.deleted && !comment.rejected,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "parentCommentId",
        filterFn: (comment) => !comment.deleted && !comment.rejected,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  descendentCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  latestChildren: {
    graphql: {
      outputType: "[Comment]",
      canRead: ["guests"],
      resolver: async (comment, args, context) => {
        const { Comments } = context;
        const params = viewTermsToQuery(CommentsViews, {
          view: "shortformLatestChildren",
          topLevelCommentId: comment._id,
        });
        return await Comments.find(params.selector, params.options).fetch();
      },
    },
  },
  shortform: {
    database: {
      type: "BOOL",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: isCommentOnPost,
      getValue: isParentPostShortform,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Comments">({ getValue: isParentPostShortform, needsUpdate: isCommentOnPost }),
      onUpdate: getDenormalizedFieldOnUpdate<"Comments">({ getValue: isParentPostShortform, needsUpdate: isCommentOnPost }),
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  shortformFrontpage: {
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
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // users can write comments nominating posts for a particular review period.
  // this field is generally set by a custom dialog,
  // set to the year of the review period (i.e. '2018')
  nominatedForReview: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  reviewingForReview: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  lastSubthreadActivity: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
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
  // The semver-style version of the post that this comment was made against
  postVersion: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      // This used to have an onCreate (in `commentResolvers.ts`), which I've moved to the `commentCreateBefore` callback
      validation: {
        optional: true,
      },
    },
  },
  promoted: {
    database: {
      type: "BOOL",
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
      label: "Pinned",
    },
  },
  promotedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      // This used to have an onUpdate, which I've moved to `commentUpdateBefore` to avoid dependency cycles
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  promotedByUser: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "promotedByUserId" }),
    },
  },
  promotedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onUpdate: async ({ data, oldDocument, newDocument }) => {
        if (data?.promoted && !oldDocument.promoted) {
          return new Date();
        }
        if (!newDocument.promoted && oldDocument.promoted) {
          return null;
        }
      },
      validation: {
        optional: true,
      },
    },
  },
  // Comments store a duplicate of their post's hideCommentKarma data. The
  // source of truth remains the hideCommentKarma field of the post. If this
  // field is true, we do not report the baseScore to non-admins. We update it
  // if (for some reason) this comment gets transferred to a new post. The
  // trickier case is updating this on post change. For that we rely on the
  // UpdateCommentHideKarma callback.
  hideKarma: {
    database: {
      type: "BOOL",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: isCommentOnPost,
      getValue: isParentPostKarmaHidden,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Comments">({ getValue: isParentPostKarmaHidden, needsUpdate: isCommentOnPost }),
      onUpdate: getDenormalizedFieldOnUpdate<"Comments">({ getValue: isParentPostKarmaHidden, needsUpdate: isCommentOnPost }),
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // DEPRECATED field for GreaterWrong backwards compatibility
  wordCount: {
    graphql: {
      outputType: "Int",
      canRead: ["guests"],
      resolver: (comment, args, context) => {
        const contents = comment.contents;
        if (!contents) return 0;
        return contents.wordCount;
      },
    },
  },
  // DEPRECATED field for GreaterWrong backwards compatibility
  htmlBody: {
    graphql: {
      outputType: "String",
      canRead: [documentIsNotDeleted],
      resolver: (comment, args, context) => {
        const contents = comment.contents;
        if (!contents) return "";
        return contents.html;
      },
    },
  },
  votingSystem: {
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      resolver: (comment, args, context) => {
        return getVotingSystemNameForDocument(comment, "Comments", context);
      },
    },
  },
  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // Legacy ID: ID used in the original LessWrong database
  legacyId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // Legacy Poll: Boolean to indicate that original LW data had a poll here
  legacyPoll: {
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // Legacy Parent Id: Id of parent comment in original LW database
  legacyParentId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // retracted: Indicates whether a comment has been retracted by its author.
  // Results in the text of the comment being struck-through, but still readable.
  retracted: {
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "checkbox",
      hidden: true,
    },
  },
  // deleted: Indicates whether a comment has been deleted by an admin.
  // Deleted comments and their replies are not rendered by default.
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "checkbox",
      hidden: true,
    },
  },
  deletedPublic: {
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  deletedReason: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  deletedDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["members"],
      onUpdate: ({ modifier }) => {
        if (modifier.$set && (modifier.$set.deletedPublic || modifier.$set.deleted)) {
          return new Date();
        }
      },
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  deletedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["members"],
      onUpdate: ({ modifier, currentUser }) => {
        if (modifier.$set && (modifier.$set.deletedPublic || modifier.$set.deleted) && currentUser) {
          return modifier.$set.deletedByUserId || currentUser._id;
        }
      },
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  deletedByUser: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "deletedByUserId" }),
    },
  },
  // spam: Indicates whether a comment has been marked as spam.
  // This removes the content of the comment, but still renders replies.
  spam: {
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
      control: "checkbox",
      hidden: true,
    },
  },
  // repliesBlockedUntil: Deactivates replying to this post by anyone except
  // admins and sunshineRegiment members until the specified time is reached.
  repliesBlockedUntil: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "datetime",
      group: () => moderationOptionsGroup,
    },
  },
  needsReview: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
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
  // hideAuthor: Displays the author as '[deleted]'. We use this to copy over
  // old deleted comments from LW 1.0
  hideAuthor: {
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
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => moderationOptionsGroup,
    },
  },
  moderatorHat: {
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
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  /**
   * Suppress user-visible styling for comments marked with `moderatorHat: true`
   */
  hideModeratorHat: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onUpdate: ({ newDocument }) => {
        if (!newDocument.moderatorHat) return null;
        return newDocument.hideModeratorHat;
      },
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  isPinnedOnProfile: {
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  title: {
    database: {
      type: "VARCHAR(500)",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      max: 500,
      order: 10,
      control: "EditCommentTitle",
      placeholder: "Title (optional)",
      hidden: (props) => {
        // Currently only allow titles for top level subforum comments
        const comment = props?.document;
        return !!(comment && !commentAllowTitle(comment));
      },
    },
  },
  relevantTagIds: {
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
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members", "admins", "sunshineRegiment"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      control: "FormComponentQuickTakesTags",
      hidden: ({ document }) => !quickTakesTagsEnabledSetting.get() || !document?.shortform,
    },
  },
  relevantTags: {
    graphql: {
      outputType: "[Tag!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Tags", fieldName: "relevantTagIds" }),
    },
  },
  debateResponse: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Dialogue Response",
      hidden: ({ currentUser, formProps }) => {
        if (!currentUser || !formProps?.post?.debate) return true;
        const { post }: { post: PostsDetails } = formProps;
        const debateParticipantsIds = [
          post.userId,
          ...(post.coauthorStatuses ?? []).map((coauthor) => coauthor.userId),
        ];
        return !debateParticipantsIds.includes(currentUser._id);
      },
    },
  },
  rejected: {
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
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // How well does ModGPT (GPT-4o) think this comment adheres to forum norms and rules? (currently EAF only)
  modGPTAnalysis: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  // This should be one of: Intervene, Consider reviewing, Don't intervene
  modGPTRecommendation: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  rejectedReason: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
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
  rejectedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onUpdate: ({ modifier, currentUser }) => {
        if (modifier.$set?.rejected && currentUser) {
          return modifier.$set.rejectedByUserId || currentUser._id;
        }
      },
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  rejectedByUser: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "rejectedByUserId" }),
    },
  },
  emojiReactors: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: async (comment, _, context) => {
        const { extendedScore } = comment;
        if (!isEAForum || !extendedScore || Object.keys(extendedScore).length < 1 || "agreement" in extendedScore) {
          return {};
        }
        if (!comment.postId) return {};
        const reactors = await context.repos.posts.getCommentEmojiReactorsWithCache(comment.postId);
        return reactors[comment._id] ?? {};
      },
    },
  },
  af: {
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
      canUpdate: ["alignmentForum", "admins"],
      canCreate: ["alignmentForum", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "AI Alignment Forum",
      hidden: (props) => isAF || !props.alignmentForumPost,
    },
  },
  suggestForAlignmentUserIds: {
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
      canUpdate: ["members", "alignmentForum", "alignmentForumAdmins"],
      onCreate: arrayOfForeignKeysOnCreate,
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Suggested for Alignment by",
      control: "FormUserMultiselect",
      group: () => alignmentOptionsGroup,  
    },
  },
  suggestForAlignmentUsers: {
    graphql: {
      outputType: "[User!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "suggestForAlignmentUserIds" }),
    },
  },
  reviewForAlignmentUserId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["alignmentForumAdmins", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "AF Review UserId",
      hidden: !isLWorAF,
      group: () => alignmentOptionsGroup,
    },
  },
  afDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["alignmentForum", "alignmentForumAdmins", "admins"],
      canCreate: ["alignmentForum", "alignmentForumAdmins", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Alignment Forum",
      group: () => alignmentOptionsGroup,
      order: 10,
    },
  },
  moveToAlignmentUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["alignmentForum", "alignmentForumAdmins", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
      label: "Move to Alignment UserId",
      group: () => alignmentOptionsGroup,
    }
  },
  moveToAlignmentUser: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "moveToAlignmentUserId" }),
    },
  },
  agentFoundationsId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  originalDialogueId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      hidden: true,
    },
  },
  originalDialogue: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "originalDialogueId" }),
    },
  },
  currentUserVote: DEFAULT_CURRENT_USER_VOTE_FIELD,
  currentUserExtendedVote: DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD,
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
  voteCount: defaultVoteCountField('Comments'),
  baseScore: {
    ...DEFAULT_BASE_SCORE_FIELD,
    graphql: {
      ...DEFAULT_BASE_SCORE_FIELD.graphql,
      outputType: "Float",
      canRead: [customBaseScoreReadAccess],
    },
  },
  extendedScore: {
    ...DEFAULT_EXTENDED_SCORE_FIELD,
    graphql: {
      ...DEFAULT_EXTENDED_SCORE_FIELD.graphql,
      canRead: [customBaseScoreReadAccess],
    },
  },
  score: DEFAULT_SCORE_FIELD,
  inactive: DEFAULT_INACTIVE_FIELD,
  afBaseScore: {
    ...DEFAULT_AF_BASE_SCORE_FIELD,
    graphql: {
      ...DEFAULT_AF_BASE_SCORE_FIELD.graphql,
      canRead: [customBaseScoreReadAccess],
    },
  },
  afExtendedScore: {
    ...DEFAULT_AF_EXTENDED_SCORE_FIELD,
    graphql: {
      ...DEFAULT_AF_EXTENDED_SCORE_FIELD.graphql,
      canRead: [customBaseScoreReadAccess],
    },
  },
  afVoteCount: DEFAULT_AF_VOTE_COUNT_FIELD,
} satisfies Record<string, CollectionFieldSpecification<"Comments">>;

export default schema;
