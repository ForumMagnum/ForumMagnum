// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { documentIsNotDeleted, userCanDo, userIsAdminOrMod, userOwns } from "../../vulcan-users/permissions";
import {
    arrayOfForeignKeysOnCreate,
    generateIdResolverMulti,
    generateIdResolverSingle,
    getDenormalizedCountOfReferencesGetValue,
    getDenormalizedFieldOnCreate,
    getDenormalizedFieldOnUpdate,
    getFillIfMissing,
    throwIfSetToNull
} from "../../utils/schemaUtils";
import { userGetDisplayNameById } from "../../vulcan-users/helpers";
import { isEAForum } from "../../instanceSettings";
import { commentGetPageUrlFromDB } from "./helpers";
import { getVotingSystemNameForDocument } from "../../voting/votingSystems";
import { viewTermsToQuery } from "../../utils/viewUtils";
import { getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { isFriendlyUI } from "@/themes/forumTheme";
import { currentUserExtendedVoteResolver, currentUserVoteResolver, getAllVotes, getCurrentUserVotes } from "@/lib/make_voteable";
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

const hNcjPf = (data) => "postId" in data;
const hkLfkr = async (comment, context) => {
  if (!comment.postId) return false;
  const post = await context.Posts.findOne({
    _id: comment.postId,
  });
  if (!post) return false;
  return !!post.shortform;
};
const hAQGGK = async (comment, context) => {
  if (!comment.postId) return false;
  const post = await context.Posts.findOne({
    _id: comment.postId,
  });
  if (!post) return false;
  return !!post.hideCommentKarma;
};

const schema: Record<string, NewCollectionFieldSpecification<"Comments">> = {
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
      canRead: ["admins"],
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
      canRead: [documentIsNotDeleted],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
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
  parentCommentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  parentComment: {
    graphql: {
      type: "Comment",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Comments", fieldName: "parentCommentId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  topLevelCommentId: {
    database: {
      type: "VARCHAR(27)",
      denormalized: true,
      foreignKey: "Comments",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  topLevelComment: {
    graphql: {
      type: "Comment",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        collectionName: "Comments",
        fieldName: "topLevelCommentId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
    },
  },
  postedAt: {
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
  lastEditedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      onUpdate: ({ oldDocument, newDocument }) => {
        if (oldDocument.contents?.html !== newDocument.contents?.html) {
          return new Date();
        }
      },
    },
  },
  author: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
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
    },
  },
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
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
      resolver: generateIdResolverSingle({ collectionName: "Comments", fieldName: "postId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  tagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  tag: {
    graphql: {
      type: "Tag",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Comments", fieldName: "tagId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  forumEventId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ForumEvents",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  forumEvent: {
    graphql: {
      type: "ForumEvent",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Comments", fieldName: "forumEventId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  forumEventMetadata: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        simpleSchema: FILL_THIS_IN,
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
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      onCreate: getFillIfMissing("DISCUSSION"),
      onUpdate: throwIfSetToNull,
      validation: {
        allowedValues: ["SUBFORUM", "DISCUSSION"],
      },
    },
  },
  subforumStickyPriority: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
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
      canRead: [documentIsNotDeleted],
      canCreate: ["members"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: [documentIsNotDeleted],
      resolver: generateIdResolverSingle({ collectionName: "Comments", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  userIP: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["admins"],
    },
  },
  userAgent: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["admins"],
    },
  },
  referrer: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["admins"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  pageUrl: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: async (comment, args, context) => {
        return await commentGetPageUrlFromDB(comment, context, true);
      },
    },
  },
  pageUrlRelative: {
    graphql: {
      type: "String",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  parentAnswerId: {
    database: {
      type: "VARCHAR(27)",
      denormalized: true,
      foreignKey: "Comments",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  parentAnswer: {
    graphql: {
      type: "Comment",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Comments", fieldName: "parentAnswerId", nullable: false }),
    },
    form: {
      hidden: true,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Comments",
        foreignFieldName: "parentCommentId",
        filterFn: (comment) => !comment.deleted && !comment.rejected,
        resyncElastic: false,
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
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(0),
      onUpdate: throwIfSetToNull,
    },
  },
  latestChildren: {
    graphql: {
      type: "[Comment]",
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
      needsUpdate: hNcjPf,
      getValue: hkLfkr,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Comments">({ getValue: hkLfkr, needsUpdate: hNcjPf }),
      onUpdate: getDenormalizedFieldOnUpdate<"Comments">({ getValue: hkLfkr, needsUpdate: hNcjPf }),
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
    },
  },
  nominatedForReview: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
    },
  },
  reviewingForReview: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
    },
  },
  lastSubthreadActivity: {
    database: {
      type: "TIMESTAMPTZ",
      denormalized: true,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  postVersion: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
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
    },
  },
  promoted: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
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
      type: "String",
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
    },
  },
  promotedByUser: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        collectionName: "Comments",
        fieldName: "promotedByUserId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
    },
  },
  promotedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onUpdate: async ({ data, document, oldDocument }) => {
        if (data?.promoted && !oldDocument.promoted) {
          return new Date();
        }
        if (!document.promoted && oldDocument.promoted) {
          return null;
        }
      },
    },
  },
  hideKarma: {
    database: {
      type: "BOOL",
      denormalized: true,
      canAutoDenormalize: true,
      needsUpdate: hNcjPf,
      getValue: hAQGGK,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "admins"],
      onCreate: getDenormalizedFieldOnCreate<"Comments">({ getValue: hAQGGK, needsUpdate: hNcjPf }),
      onUpdate: getDenormalizedFieldOnUpdate<"Comments">({ getValue: hAQGGK, needsUpdate: hNcjPf }),
    },
  },
  wordCount: {
    graphql: {
      type: "Int",
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
      type: "String",
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
      type: "String!",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  legacyId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  legacyParentId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  deletedReason: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  deletedDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["members"],
      onUpdate: ({ modifier }) => {
        if (modifier.$set && (modifier.$set.deletedPublic || modifier.$set.deleted)) {
          return new Date();
        }
      },
    },
  },
  deletedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["members"],
      onUpdate: ({ modifier, document, currentUser }) => {
        if (modifier.$set && (modifier.$set.deletedPublic || modifier.$set.deleted) && currentUser) {
          return modifier.$set.deletedByUserId || currentUser._id;
        }
      },
    },
  },
  deletedByUser: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Comments", fieldName: "deletedByUserId", nullable: false }),
    },
    form: {
      hidden: true,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  repliesBlockedUntil: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
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
      resolver: generateIdResolverSingle({
        collectionName: "Comments",
        fieldName: "reviewedByUserId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  hideModeratorHat: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onUpdate: ({ newDocument }) => {
        if (!newDocument.moderatorHat) return null;
        return newDocument.hideModeratorHat;
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  title: {
    database: {
      type: "VARCHAR(500)",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["members", "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      type: "[String]",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members", "admins", "sunshineRegiment"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  relevantTags: {
    graphql: {
      type: "[Tag!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Comments", fieldName: "relevantTagIds" }),
    },
    form: {
      hidden: true,
    },
  },
  debateResponse: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  modGPTAnalysis: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  modGPTRecommendation: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  rejectedReason: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  rejectedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      onUpdate: ({ modifier, document, currentUser }) => {
        if (modifier.$set?.rejected && currentUser) {
          return modifier.$set.rejectedByUserId || currentUser._id;
        }
      },
    },
  },
  rejectedByUser: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        collectionName: "Comments",
        fieldName: "rejectedByUserId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
    },
  },
  emojiReactors: {
    graphql: {
      type: "JSON",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["alignmentForum", "admins"],
      canCreate: ["alignmentForum", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
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
      type: "[String]",
      canRead: ["guests"],
      canUpdate: ["members", "alignmentForum", "alignmentForumAdmins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  suggestForAlignmentUsers: {
    graphql: {
      type: "[User!]!",
      canRead: ["guests"],
      resolver: generateIdResolverMulti({ collectionName: "Comments", fieldName: "suggestForAlignmentUserIds" }),
    },
    form: {
      hidden: true,
    },
  },
  reviewForAlignmentUserId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["alignmentForumAdmins", "admins"],
    },
  },
  afDate: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      canUpdate: ["alignmentForum", "alignmentForumAdmins", "admins"],
      canCreate: ["alignmentForum", "alignmentForumAdmins", "admins"],
    },
  },
  moveToAlignmentUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["alignmentForum", "alignmentForumAdmins", "admins"],
    },
  },
  moveToAlignmentUser: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        collectionName: "Comments",
        fieldName: "moveToAlignmentUserId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
    },
  },
  agentFoundationsId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["admins"],
    },
  },
  originalDialogueId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["members", "sunshineRegiment", "admins"],
    },
  },
  originalDialogue: {
    graphql: {
      type: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({
        collectionName: "Comments",
        fieldName: "originalDialogueId",
        nullable: true,
      }),
    },
    form: {
      hidden: true,
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
        collectionName: "Comments",
        fieldName: "voteCount",
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Comments",
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
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Comments",
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
      canRead: (user, comment) => {
        return !comment.hideKarma || userCanDo(user, "posts.moderate.all");
      },
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
      canRead: (user, comment) => {
        return !comment.hideKarma || userCanDo(user, "posts.moderate.all");
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
