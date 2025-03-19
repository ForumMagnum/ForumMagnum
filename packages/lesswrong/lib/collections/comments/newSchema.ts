// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

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
import { getVotingSystemNameForDocument } from "../../voting/votingSystems";
import { viewTermsToQuery } from "../../utils/viewUtils";
import { quickTakesTagsEnabledSetting } from "../../publicSettings";
import { ForumEventCommentMetadataSchema } from "../forumEvents/types";
import { getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver } from "@/lib/editor/make_editable";
import { isFriendlyUI } from "@/themes/forumTheme";
import { currentUserExtendedVoteResolver, currentUserVoteResolver, getAllVotes, getCurrentUserVotes } from "@/lib/make_voteable";
import { customBaseScoreReadAccess } from "./voting";
import { fetchFragmentSingle } from "@/server/fetchFragment";
import { updateMutator } from "@/server/vulcan-lib/mutators";

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

const hSpyBs = (data) => "postId" in data;
const hQhmP9 = async (comment, context) => {
  if (!comment.postId) return false;
  const post = await context.Posts.findOne({
    _id: comment.postId,
  });
  if (!post) return false;
  return !!post.shortform;
};
const htKrvN = async (comment, context) => {
  if (!comment.postId) return false;
  const post = await context.Posts.findOne({
    _id: comment.postId,
  });
  if (!post) return false;
  return !!post.hideCommentKarma;
};

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
      canRead: ["admins"],
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
      },
    },
  },
  contents: {
    graphql: {
      outputType: "Revision",
      canRead: [documentIsNotDeleted],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: true, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Comments", "contents"),
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
  },
  topLevelComment: {
    graphql: {
      outputType: "Comment",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Comments", fieldName: "topLevelCommentId" }),
    },
  },
  postedAt: {
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
  },
  forumEvent: {
    graphql: {
      outputType: "ForumEvent",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "ForumEvents", fieldName: "forumEventId" }),
    },
  },
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
  },
  tagCommentType: {
    database: {
      type: "TEXT",
      defaultValue: "DISCUSSION",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["SUBFORUM", "DISCUSSION"],
        optional: true,
      },
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
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
      outputType: "Float",
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
        const params = viewTermsToQuery("Comments", {
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
      needsUpdate: hSpyBs,
      getValue: hQhmP9,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Comments">({ getValue: hQhmP9, needsUpdate: hSpyBs }),
      onUpdate: getDenormalizedFieldOnUpdate<"Comments">({ getValue: hQhmP9, needsUpdate: hSpyBs }),
      validation: {
        optional: true,
      },
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        optional: true,
      },
    },
  },
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
  postVersion: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      onCreate: async ({ newDocument }) => {
        if (!newDocument.postId) {
          return "1.0.0";
        }
        const post = await fetchFragmentSingle({
          collectionName: "Posts",
          fragmentName: "PostsRevision",
          currentUser: null,
          selector: {
            _id: newDocument.postId,
          },
        });
        return (post && post.contents && post.contents.version) || "1.0.0";
      },
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
      onUpdate: async ({ data, currentUser, document, oldDocument, context }) => {
        if (data?.promoted && !oldDocument.promoted && document.postId) {
          void updateMutator({
            collection: context.Posts,
            context,
            documentId: document.postId,
            data: {
              lastCommentPromotedAt: new Date(),
            },
            currentUser,
            validate: false,
          });
          return currentUser._id;
        }
      },
      validation: {
        optional: true,
      },
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
      onUpdate: async ({ data, document, oldDocument }) => {
        if (data?.promoted && !oldDocument.promoted) {
          return new Date();
        }
        if (!document.promoted && oldDocument.promoted) {
          return null;
        }
      },
      validation: {
        optional: true,
      },
    },
  },
  hideKarma: {
    database: {
      type: "BOOL",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: hSpyBs,
      getValue: htKrvN,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Comments">({ getValue: htKrvN, needsUpdate: hSpyBs }),
      onUpdate: getDenormalizedFieldOnUpdate<"Comments">({ getValue: htKrvN, needsUpdate: hSpyBs }),
      validation: {
        optional: true,
      },
    },
  },
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
  legacy: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
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
  },
  legacyPoll: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
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
  },
  retracted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
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
      onUpdate: ({ modifier, document, currentUser }) => {
        if (modifier.$set && (modifier.$set.deletedPublic || modifier.$set.deleted) && currentUser) {
          return modifier.$set.deletedByUserId || currentUser._id;
        }
      },
      validation: {
        optional: true,
      },
    },
  },
  deletedByUser: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "deletedByUserId" }),
    },
  },
  spam: {
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
  },
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
  hideAuthor: {
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
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
  },
  isPinnedOnProfile: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
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
      outputType: "[String]",
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
        const { post } = formProps;
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
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
  },
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
      onUpdate: ({ modifier, document, currentUser }) => {
        if (modifier.$set?.rejected && currentUser) {
          return modifier.$set.rejectedByUserId || currentUser._id;
        }
      },
      validation: {
        optional: true,
      },
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
      outputType: "Boolean",
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
      outputType: "[String]",
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
  },
  originalDialogue: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "originalDialogueId" }),
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
        collectionName: "Comments",
        fieldName: "voteCount",
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Comments",
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
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Comments",
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
      canRead: customBaseScoreReadAccess,
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
      canRead: customBaseScoreReadAccess,
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
} satisfies Record<string, NewCollectionFieldSpecification<"Comments">>;

export default schema;
