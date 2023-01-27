import { userOwns } from '../../vulcan-users/permissions';
import { arrayOfForeignKeysField, foreignKeyField, resolverOnlyField, denormalizedField, denormalizedCountOfReferences } from '../../utils/schemaUtils';
import { mongoFindOne } from '../../mongoQueries';
import { userGetDisplayNameById } from '../../vulcan-users/helpers';
import { schemaDefaultValue } from '../../collectionUtils';
import { Utils } from '../../vulcan-lib';
import { forumTypeSetting } from "../../instanceSettings";
import { commentAllowTitle, commentGetPageUrlFromDB } from './helpers';
import { tagCommentTypes } from './types';
import { getVotingSystemNameForDocument } from '../../voting/votingSystems';
import { viewTermsToQuery } from '../../utils/viewUtils';


export const moderationOptionsGroup: FormGroup = {
  order: 50,
  name: "moderation",
  label: "Moderator Options",
  startCollapsed: true
};

export const alignmentOptionsGroup = {
  order: 50,
  name: "alignment",
  label: "Alignment Options",
  startCollapsed: true
};

const alignmentForum = forumTypeSetting.get() === 'AlignmentForum'

const schema: SchemaType<DbComment> = {
  // The `_id` of the parent comment, if there is one
  parentCommentId: {
    ...foreignKeyField({
      idFieldName: "parentCommentId",
      resolverName: "parentComment",
      collectionName: "Comments",
      type: "Comment",
      nullable: true,
    }),
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
  },
  // The `_id` of the top-level parent comment, if there is one
  topLevelCommentId: {
    ...foreignKeyField({
      idFieldName: "topLevelCommentId",
      resolverName: "topLevelComment",
      collectionName: "Comments",
      type: "Comment",
      nullable: true,
    }),
    denormalized: true,
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
  },
  // The timestamp of the comment being posted. For now, comments are always
  // created and posted at the same time
  postedAt: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => new Date(),
  },
  // The comment author's name
  author: {
    type: String,
    optional: true,
    canRead: ['guests'],
    onInsert: async (document, currentUser) => {
      // if userId is changing, change the author name too
      if (document.userId) {
        return await userGetDisplayNameById(document.userId)
      }
    },
    onEdit: async (modifier, document, currentUser) => {
      // if userId is changing, change the author name too
      if (modifier.$set && modifier.$set.userId) {
        return await userGetDisplayNameById(modifier.$set.userId)
      }
    }
  },
  // If this comment is on a post, the _id of that post.
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  // If this comment is associated with a tag (in the discussion section or subforum), the _id of the tag.
  tagId: {
    ...foreignKeyField({
      idFieldName: "tagId",
      resolverName: "tag",
      collectionName: "Tags",
      type: "Tag",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  // Whether the comment is in the discussion section or subforum
  tagCommentType: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    allowedValues: Object.values(tagCommentTypes),
    hidden: true,
    ...schemaDefaultValue("DISCUSSION"),
  },
  subforumStickyPriority: {
    type: Number,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },
  // The comment author's `_id`
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },
  userIP: {
    type: String,
    optional: true,
    canRead: ['admins'],
  },
  userAgent: {
    type: String,
    optional: true,
    canRead: ['admins'],
  },
  referrer: {
    type: String,
    optional: true,
    canRead: ['admins'],
  },
  authorIsUnreviewed: {
    type: Boolean,
    optional: true,
    denormalized: true,
    ...schemaDefaultValue(false),
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    hidden: true,
  },

  // GraphQL only fields

  pageUrl: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: async (comment: DbComment, args: void, context: ResolverContext) => {
      return await commentGetPageUrlFromDB(comment, context, true)
    },
  }),

  pageUrlRelative: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: async (comment: DbComment, args: void, context: ResolverContext) => {
      return await commentGetPageUrlFromDB(comment, context, false)
    },
  }),

  answer: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
  },

  parentAnswerId: {
    ...foreignKeyField({
      idFieldName: "parentAnswerId",
      resolverName: "parentAnswer",
      collectionName: "Comments",
      type: "Comment",
      nullable: true,
    }),
    denormalized: true,
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
  },


  directChildrenCount: {
    ...denormalizedCountOfReferences({
      fieldName: "directChildrenCount",
      collectionName: "Comments",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "parentCommentId",
      filterFn: (comment: DbComment) => !comment.deleted
    }),
    canRead: ['guests'],
  },
  
  // Number of descendent comments (including indirect descendents).
  descendentCount: {
    type: Number,
    denormalized: true,
    canRead: ['guests'],
    optional: true, hidden: true,
    ...schemaDefaultValue(0),
  },
  
  latestChildren: resolverOnlyField({
    type: Array,
    graphQLtype: '[Comment]',
    viewableBy: ['guests'],
    resolver: async (comment: DbComment, args: void, context: ResolverContext) => {
      const { Comments } = context;
      const params = viewTermsToQuery("Comments", {view:"shortformLatestChildren", topLevelCommentId: comment._id});
      return await Comments.find(params.selector, params.options).fetch()
    }
  }),
  'latestChildren.$': {
    type: String,
    optional: true,
  },
  
  shortform: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members', 'admins'],
    canUpdate: [userOwns, 'admins'],
    ...denormalizedField({
      needsUpdate: data => ('postId' in data),
      getValue: async (comment: DbComment): Promise<boolean> => {
        if (!comment.postId) return false;
        const post = await mongoFindOne("Posts", {_id: comment.postId});
        if (!post) return false;
        return !!post.shortform;
      }
    }),
  },

  // users can write comments nominating posts for a particular review period.
  // this field is generally set by a custom dialog,
  // set to the year of the review period (i.e. '2018')
  nominatedForReview: {
    type: String,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members', 'admins'],
    canUpdate: [userOwns, 'admins'],
  },
  reviewingForReview: {
    type: String,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members', 'admins'],
    canUpdate: [userOwns, 'admins'],
  },

  lastSubthreadActivity: {
    type: Date,
    denormalized: true,
    optional: true,
    viewableBy: ['guests'],
    onInsert: (document, currentUser) => new Date(),
  },

  // The semver-style version of the post that this comment was made against
  // This gets automatically created in a callback on creation
  postVersion: {
    type: String,
    optional: true,
    canRead: ['guests'],
    onCreate: async ({newDocument}) => {
      if (!newDocument.postId) return "1.0.0";
      const post = await mongoFindOne("Posts", {_id: newDocument.postId})
      return (post && post.contents && post.contents.version) || "1.0.0"
    }
  },

  promoted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
  },

  promotedByUserId: {
    ...foreignKeyField({
      idFieldName: "promotedByUserId",
      resolverName: "promotedByUser",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
    onUpdate: async ({data, currentUser, document, oldDocument, context}: {
      data: Partial<DbComment>,
      currentUser: DbUser|null,
      document: DbComment,
      oldDocument: DbComment,
      context: ResolverContext,
    }) => {
      if (data?.promoted && !oldDocument.promoted && document.postId) {
        Utils.updateMutator({
          collection: context.Posts,
          context,
          selector: {_id:document.postId},
          data: { lastCommentPromotedAt: new Date() },
          currentUser,
          validate: false
        })
        return currentUser!._id
      }
    }
  },

  promotedAt: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    onUpdate: async ({data, document, oldDocument}) => {
      if (data?.promoted && !oldDocument.promoted) {
        return new Date()
      }
      if (!document.promoted && oldDocument.promoted) {
        return null
      }
    }
  },
  
  // Comments store a duplicate of their post's hideCommentKarma data. The
  // source of truth remains the hideCommentKarma field of the post. If this
  // field is true, we do not report the baseScore to non-admins. We update it
  // if (for some reason) this comment gets transferred to a new post. The
  // trickier case is updating this on post change. For that we rely on the
  // UpdateCommentHideKarma callback.
  hideKarma: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members', 'admins'],
    canUpdate: ['admins'],
    ...denormalizedField({
      needsUpdate: data => ('postId' in data),
      getValue: async comment => {
        if (!comment.postId) return false;
        const post = await mongoFindOne("Posts", {_id: comment.postId});
        if (!post) return false;
        return !!post.hideCommentKarma;
      }
    }),
  },
  
  // DEPRECATED field for GreaterWrong backwards compatibility
  wordCount: resolverOnlyField({
    type: Number,
    viewableBy: ['guests'],
    resolver: (comment: DbComment, args: void, context: ResolverContext) => {
      const contents = comment.contents;
      if (!contents) return 0;
      return contents.wordCount;
    }
  }),
  // DEPRECATED field for GreaterWrong backwards compatibility
  htmlBody: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (comment: DbComment, args: void, context: ResolverContext) => {
      const contents = comment.contents;
      if (!contents) return "";
      return contents.html;
    }
  }),
  
  votingSystem: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (comment: DbComment, args: void, context: ResolverContext): Promise<string> => {
      return getVotingSystemNameForDocument(comment, context)
    }
  }),
  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
    type: Boolean,
    optional: true,
    hidden: true,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  // Legacy ID: ID used in the original LessWrong database
  legacyId: {
    type: String,
    hidden: true,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  // Legacy Poll: Boolean to indicate that original LW data had a poll here
  legacyPoll: {
    type: Boolean,
    optional: true,
    hidden: true,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  // Legacy Parent Id: Id of parent comment in original LW database
  legacyParentId: {
    type: String,
    hidden: true,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
  },

  // retracted: Indicates whether a comment has been retracted by its author.
  // Results in the text of the comment being struck-through, but still readable.
  retracted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    control: "checkbox",
    hidden: true,
    ...schemaDefaultValue(false),
  },

  // deleted: Indicates whether a comment has been deleted by an admin.
  // Deleted comments and their replies are not rendered by default.
  deleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    control: "checkbox",
    hidden: true,
    ...schemaDefaultValue(false),
  },

  deletedPublic: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    ...schemaDefaultValue(false),
  },

  deletedReason: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
  },

  deletedDate: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['sunshineRegiment', 'admins'],
    onEdit: (modifier, document, currentUser) => {
      if (modifier.$set && (modifier.$set.deletedPublic || modifier.$set.deleted)) {
        return new Date()
      }
    },
    hidden: true,
  },

  deletedByUserId: {
    ...foreignKeyField({
      idFieldName: "deletedByUserId",
      resolverName: "deletedByUser",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['members'],
    hidden: true,
    onEdit: (modifier, document, currentUser) => {
      if (modifier.$set && (modifier.$set.deletedPublic || modifier.$set.deleted) && currentUser) {
        return modifier.$set.deletedByUserId || currentUser._id
      }
    },
  },

  // spam: Indicates whether a comment has been marked as spam.
  // This removes the content of the comment, but still renders replies.
  spam: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: "checkbox",
    hidden: true,
    ...schemaDefaultValue(false),
  },

  // repliesBlockedUntil: Deactivates replying to this post by anyone except
  // admins and sunshineRegiment members until the specified time is reached.
  repliesBlockedUntil: {
    type: Date,
    optional: true,
    group: moderationOptionsGroup,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    control: 'datetime'
  },

  needsReview: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },

  reviewedByUserId: {
    ...foreignKeyField({
      idFieldName: "reviewedByUserId",
      resolverName: "reviewedByUser",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },

  // hideAuthor: Displays the author as '[deleted]'. We use this to copy over
  // old deleted comments from LW 1.0
  hideAuthor: {
    type: Boolean,
    group: moderationOptionsGroup,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    ...schemaDefaultValue(false),
  },
  
  moderatorHat: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
    hidden: true
  },

  /**
   * Suppress user-visible styling for comments marked with `moderatorHat: true`
   */
  hideModeratorHat: {
    type: Boolean,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    onUpdate: ({ newDocument }) => {
      if (!newDocument.moderatorHat) return null;
      return newDocument.hideModeratorHat;
    },
    hidden: true
  },

  // whether this comment is pinned on the author's profile
  isPinnedOnProfile: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    hidden: true,
    ...schemaDefaultValue(false),
  },
  
  commentApproval: resolverOnlyField({
    type: 'CommentApproval',
    graphQLtype: 'CommentApproval',
    nullable: true,
    canRead: ['guests'],
    resolver: (comment, args, context) => {
      return context.CommentApprovals.findOne({ commentId: comment._id });
    }
  }),
  
  title: {
    type: String,
    optional: true,
    max: 500,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    order: 10,
    placeholder: "Title (optional)",
    control: "EditCommentTitle",
    hidden: (props) => {
      // Currently only allow titles for top level subforum comments
      const comment = props?.document
      return !commentAllowTitle(comment)
    }
  },
};

/* Alignment Forum fields */
Object.assign(schema, {
  af: {
    type: Boolean,
    optional: true,
    label: "AI Alignment Forum",
    ...schemaDefaultValue(false),
    viewableBy: ['guests'],
    editableBy: ['alignmentForum', 'admins'],
    insertableBy: ['alignmentForum', 'admins'],
    hidden: (props) => alignmentForum || !props.alignmentForumPost
  },

  suggestForAlignmentUserIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "suggestForAlignmentUserIds",
      resolverName: "suggestForAlignmentUsers",
      collectionName: "Users",
      type: "User"
    }),
    viewableBy: ['members'],
    editableBy: ['members', 'alignmentForum', 'alignmentForumAdmins'],
    optional: true,
    label: "Suggested for Alignment by",
    control: "UsersListEditor",
    group: alignmentOptionsGroup,
    hidden: true
  },
  'suggestForAlignmentUserIds.$': {
    type: String,
    optional: true
  },

  reviewForAlignmentUserId: {
    type: String,
    optional: true,
    group: alignmentOptionsGroup,
    viewableBy: ['guests'],
    editableBy: ['alignmentForumAdmins', 'admins'],
    label: "AF Review UserId",
    hidden: forumTypeSetting.get() === 'EAForum'
  },

  afDate: {
    order:10,
    type: Date,
    optional: true,
    label: "Alignment Forum",
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
    insertableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
    group: alignmentOptionsGroup,
  },

  moveToAlignmentUserId: {
    ...foreignKeyField({
      idFieldName: "moveToAlignmentUserId",
      resolverName: "moveToAlignmentUser",
      collectionName: "Users",
      type: "User",
    }),
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['alignmentForum', 'alignmentForumAdmins', 'admins'],
    group: alignmentOptionsGroup,
    label: "Move to Alignment UserId",
  },

  agentFoundationsId: {
    type: String,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    insertableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
  },
});

export default schema;
