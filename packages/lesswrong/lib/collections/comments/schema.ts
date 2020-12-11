import { userOwns } from '../../vulcan-users/permissions';
import { foreignKeyField, resolverOnlyField, denormalizedField, denormalizedCountOfReferences } from '../../../lib/utils/schemaUtils';
import { mongoFindOne } from '../../mongoQueries';
import { commentGetPageUrl } from './helpers';
import { userGetDisplayNameById } from '../../vulcan-users/helpers';
import { schemaDefaultValue } from '../../collectionUtils';
import { Utils } from '../../vulcan-lib';

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
  // The timestamp of comment creation
  createdAt: {
    type: Date,
    optional: true,
    canRead: ['admins'],
    onInsert: (document, currentUser) => new Date(),
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
    onInsert: (document, currentUser) => {
      // if userId is changing, change the author name too
      if (document.userId) {
        return userGetDisplayNameById(document.userId)
      }
    },
    onEdit: (modifier, document, currentUser) => {
      // if userId is changing, change the author name too
      if (modifier.$set && modifier.$set.userId) {
        return userGetDisplayNameById(modifier.$set.userId)
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
  // If this comment is in a tag discussion section, the _id of the tag.
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
  // Whether the comment is deleted. Delete comments' content doesn't appear on the site.
  // FIXME: Not a real field. We inherited this from vulcan-starter, but
  // implemented our own, unrelated soft delete mechanism with the field named
  // `deleted` rather than `isDeleted`.
  isDeleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
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
    resolver: (comment: DbComment, args: void, context: ResolverContext) => {
      return commentGetPageUrl(comment, true)
    },
  }),

  pageUrlRelative: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (comment: DbComment, args: void, context: ResolverContext) => {
      return commentGetPageUrl(comment, false)
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
  
  latestChildren: resolverOnlyField({
    type: Array,
    graphQLtype: '[Comment]',
    viewableBy: ['guests'],
    resolver: async (comment: DbComment, args: void, context: ResolverContext) => {
      const { Comments } = context;
      const params = Comments.getParameters({view:"shortformLatestChildren", topLevelCommentId: comment._id})
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
};

export default schema;
