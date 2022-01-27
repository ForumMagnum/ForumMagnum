import { userOwns } from '../../vulcan-users/permissions';
import { Utils, slugify, getDomain, getOutgoingUrl } from '../../vulcan-lib/utils';
import moment from 'moment';
import { foreignKeyField, resolverOnlyField, denormalizedField, denormalizedCountOfReferences, accessFilterMultiple, accessFilterSingle } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';
import { PostRelations } from "../postRelations/collection"
import { postGetPageUrl, postGetEmailShareUrl, postGetTwitterShareUrl, postGetFacebookShareUrl, postGetDefaultStatus, getSocialPreviewImage } from './helpers';
import { postStatuses, postStatusLabels } from './constants';
import { userGetDisplayNameById } from '../../vulcan-users/helpers';
import { TagRels } from "../tagRels/collection";
import { getWithLoader } from '../../loaders';
import { formGroups } from './formGroups';
import SimpleSchema from 'simpl-schema'
import { DEFAULT_QUALITATIVE_VOTE } from '../reviewVotes/schema';
import { getVotingSystems } from '../../voting/votingSystems';

const STICKY_PRIORITIES = {
  1: "Low",
  2: "Normal",
  3: "Elevated",
  4: "Max",
}

export interface RSVPType {
  name: string
  email: string
  nonPublic: boolean
  response: "yes" | "maybe" | "no"
  userId: string
  createdAt: Date
}
const rsvpType = new SimpleSchema({
  name: {
    type: String,
  },
  email: {
    type: String,
    optional: true,
  },
  nonPublic: {
    type: Boolean,
    optional: true,
  },
  response: {
    type: String,
    allowedValues: ["yes", "maybe", "no"],
  },
  userId: {
    type: String,
    optional: true,
  },
  createdAt: {
    type: Date,
    optional: true
  },
})


const schema: SchemaType<DbPost> = {
  // Timestamp of post creation
  createdAt: {
    type: Date,
    optional: true,
    viewableBy: ['admins'],
    onInsert: () => new Date(),
  },
  // Timestamp of post first appearing on the site (i.e. being approved)
  postedAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    control: 'datetime',
    group: formGroups.adminOptions,
    onInsert: (post, currentUser) => {
      // Set the post's postedAt if it's going to be approved
      if (!post.postedAt && postGetDefaultStatus(currentUser!) === postStatuses.STATUS_APPROVED) {
        return new Date();
      }
    },
    onEdit: (modifier, post) => {
      // Set the post's postedAt if it's going to be approved
      if (!post.postedAt && modifier.$set.status === postStatuses.STATUS_APPROVED) {
        return new Date();
      }
    }
  },
  // Timestamp of last post modification
  modifiedAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    ...denormalizedField({
      getValue: () => {
        return new Date()
      }
    }),
  },
  // URL
  url: {
    type: String,
    optional: true,
    max: 500,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    control: 'EditUrl',
    order: 12,
    query: `
      SiteData{
        logoUrl
        title
      }
    `,
    placeholder: 'Add a linkpost URL',
    group: formGroups.options,
  },
  // Title
  title: {
    type: String,
    optional: false,
    max: 500,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    order: 10,
    placeholder: "Title",
    control: 'EditTitle',
    group: formGroups.default,
  },
  // Slug
  slug: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    onInsert: async (post) => {
      return await Utils.getUnusedSlugByCollectionName("Posts", slugify(post.title))
    },
    onEdit: async (modifier, post) => {
      if (modifier.$set.title) {
        return await Utils.getUnusedSlugByCollectionName("Posts", slugify(modifier.$set.title), false, post._id)
      }
    }
  },
  // Count of how many times the post's page was viewed
  viewCount: {
    type: Number,
    optional: true,
    viewableBy: ['admins'],
    defaultValue: 0
  },
  // Timestamp of the last comment
  lastCommentedAt: {
    type: Date,
    denormalized: true,
    optional: true,
    viewableBy: ['guests'],
    hidden: true,
    onInsert: (post: DbPost) => post.postedAt || new Date(),
  },
  // Count of how many times the post's link was clicked
  clickCount: {
    type: Number,
    optional: true,
    viewableBy: ['admins'],
    defaultValue: 0
  },

  deletedDraft: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    viewableBy: ['guests'],
    editableBy: ['members'],
    hidden: true,
  },

  // The post's status. One of pending (`1`), approved (`2`), rejected (`3`), spam (`4`) or deleted (`5`)
  status: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins', 'sunshineRegiment'],
    control: 'select',
    onInsert: (document, currentUser) => {
      if (!document.status) {
        return postGetDefaultStatus(currentUser!);
      }
    },
    onEdit: (modifier, document, currentUser) => {
      // if for some reason post status has been removed, give it default status
      if (modifier.$unset && modifier.$unset.status) {
        return postGetDefaultStatus(currentUser!);
      }
    },
    options: () => postStatusLabels,
    group: formGroups.adminOptions
  },
  // Whether a post is scheduled in the future or not
  isFuture: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    onInsert: (post) => {
      // Set the post's isFuture to true if necessary
      if (post.postedAt) {
        const postTime = new Date(post.postedAt).getTime();
        const currentTime = new Date().getTime() + 1000;
        return postTime > currentTime; // round up to the second
      } else {
        return false;
      }
    },
    onEdit: (modifier, post) => {
      // Set the post's isFuture to true if necessary
      if (modifier.$set.postedAt) {
        const postTime = new Date(modifier.$set.postedAt).getTime();
        const currentTime = new Date().getTime() + 1000;
        if (postTime > currentTime) {
          // if a post's postedAt date is in the future, set isFuture to true
          return true;
        } else if (post.isFuture) {
          // else if a post has isFuture to true but its date is in the past, set isFuture to false
          return false;
        }
      }
    }
  },
  // Whether the post is sticky (pinned to the top of posts lists)
  sticky: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    control: 'checkbox',
    order: 10,
    group: formGroups.adminOptions,
    onInsert: (post) => {
      if(!post.sticky) {
        return false;
      }
    },
    onEdit: (modifier, post) => {
      if (!modifier.$set.sticky) {
        return false;
      }
    }
  },
  // Priority of the stickied post. Higher priorities will be sorted before
  // lower priorities.
  stickyPriority: {
    type: SimpleSchema.Integer,
    ...schemaDefaultValue(2),
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    control: 'select',
    options: () => Object.entries(STICKY_PRIORITIES).map(([level, name]) => ({
      value: parseInt(level),
      label: name
    })),
    group: formGroups.adminOptions,
    order: 11,
    optional: true,
  },
  // Save info for later spam checking on a post. We will use this for the akismet package
  userIP: {
    type: String,
    optional: true,
    viewableBy: ['admins'],
  },
  userAgent: {
    type: String,
    optional: true,
    viewableBy: ['admins'],
  },
  referrer: {
    type: String,
    optional: true,
    viewableBy: ['admins'],
  },
  // The post author's name
  author: {
    type: String,
    denormalized: true,
    optional: true,
    viewableBy: ['guests'],
    onEdit: async (modifier, document, currentUser) => {
      // if userId is changing, change the author name too
      if (modifier.$set && modifier.$set.userId) {
        return await userGetDisplayNameById(modifier.$set.userId)
      }
    }
  },
  // The post author's `_id`.
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true
    }),
    optional: true,
    control: 'text',
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    tooltip: 'The user id of the author',
    
    group: formGroups.adminOptions,
  },

  // GraphQL-only fields

  domain: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => getDomain(post.url),
  }),

  pageUrl: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => postGetPageUrl(post, true),
  }),
  
  pageUrlRelative: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => postGetPageUrl(post, false),
  }),

  linkUrl: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => {
      return post.url ? getOutgoingUrl(post.url) : postGetPageUrl(post, true);
    },
  }),

  postedAtFormatted: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => {
      return moment(post.postedAt).format('dddd, MMMM Do YYYY');
    }
  }),

  emailShareUrl: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => postGetEmailShareUrl(post),
  }),

  twitterShareUrl: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => postGetTwitterShareUrl(post),
  }),

  facebookShareUrl: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => postGetFacebookShareUrl(post),
  }),
  
  socialPreviewImageUrl: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => getSocialPreviewImage(post)
  }),

  question: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    viewableBy: ['guests'],
    insertableBy: ['members'],
    hidden: true,
  },

  authorIsUnreviewed: {
    type: Boolean,
    optional: true,
    denormalized: true,
    ...schemaDefaultValue(false),
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
  },
  
  // DEPRECATED field for GreaterWrong backwards compatibility
  wordCount: resolverOnlyField({
    type: Number,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, { Posts }: ResolverContext) => {
      const contents = post.contents;
      if (!contents) return 0;
      return contents.wordCount;
    }
  }),
  // DEPRECATED field for GreaterWrong backwards compatibility
  htmlBody: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: (post: DbPost, args: void, { Posts }: ResolverContext) => {
      const contents = post.contents;
      if (!contents) return "";
      return contents.html;
    }
  }),

  submitToFrontpage: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'admins', 'sunshineRegiment'],
    optional: true,
    hidden: true,
    ...schemaDefaultValue(true),
    onCreate: ({newDocument}: { newDocument: DbPost }) => {
      if (newDocument.isEvent) return false
      if ('submitToFrontpage' in newDocument) return newDocument.submitToFrontpage
      return true
    },
    onUpdate: ({data, document}: { data: Partial<DbPost>, document: DbPost }) => {
      const updatedDocIsEvent = ('isEvent' in document) ? document.isEvent : false
      if (updatedDocIsEvent) return false
      return ('submitToFrontpage' in document) ? document.submitToFrontpage : true
    }
  },

  hiddenRelatedQuestion: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'admins', 'sunshineRegiment'],
    hidden: true,
    optional: true,
    ...schemaDefaultValue(false),
  },

  originalPostRelationSourceId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    hidden: true,
  },

  sourcePostRelations: resolverOnlyField({
    type: Array,
    graphQLtype: '[PostRelation!]!',
    viewableBy: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const result = await PostRelations.find({targetPostId: post._id}).fetch()
      return await accessFilterMultiple(context.currentUser, PostRelations, result, context);
    }
  }),
  'sourcePostRelations.$': {
    type: String,
    optional: true,
  },

  targetPostRelations: resolverOnlyField({
    type: Array,
    graphQLtype: '[PostRelation!]!',
    viewableBy: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const { Posts, currentUser } = context;
      const postRelations = await Posts.aggregate([
        { $match: { _id: post._id }},
        { $graphLookup: { 
            from: "postrelations", 
            as: "relatedQuestions", 
            startWith: post._id, 
            connectFromField: "targetPostId", 
            connectToField: "sourcePostId", 
            maxDepth: 3 
          } 
        },
        { 
          $project: {
            relatedQuestions: 1
          }
        }, 
        {
          $unwind: "$relatedQuestions"
        }, 
        {
          $replaceRoot: {
            newRoot: "$relatedQuestions"
          }
        }
     ]).toArray()
     if (!postRelations || postRelations.length < 1) return []
     return await accessFilterMultiple(currentUser, PostRelations, postRelations, context);
    }
  }),
  'targetPostRelations.$': {
    type: String,
    optional: true,
  },
  
  // A post should have the shortform flag set iff its author's shortformFeedId
  // field is set to this post's ID.
  shortform: {
    type: Boolean,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    denormalized: true,
    ...schemaDefaultValue(false),
  },

  canonicalSource: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    group: formGroups.adminOptions,
  },

  nominationCount2018: {
    ...denormalizedCountOfReferences({
      fieldName: "nominationCount2018",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: comment => !comment.deleted && comment.nominatedForReview === "2018"
    }),
    canRead: ['guests'],
  },

  nominationCount2019: {
    ...denormalizedCountOfReferences({
      fieldName: "nominationCount2019",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: comment => !comment.deleted && comment.nominatedForReview === "2019"
    }),
    canRead: ['guests'],
  },

  reviewCount2018: {
    ...denormalizedCountOfReferences({
      fieldName: "reviewCount2018",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: comment => !comment.deleted && comment.reviewingForReview === "2018"
    }),
    canRead: ['guests'],
  },

  reviewCount2019: {
    ...denormalizedCountOfReferences({
      fieldName: "reviewCount2019",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: comment => !comment.deleted && comment.reviewingForReview === "2019"
    }),
    canRead: ['guests'],
  },

  reviewCount: {
    ...denormalizedCountOfReferences({
      fieldName: "reviewCount",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: comment => !comment.deleted && !!comment.reviewingForReview
    }),
    canRead: ['guests'],
  },

  reviewVoteCount: {
    type: Number,
    optional: true,
    defaultValue: 0,
    ...denormalizedCountOfReferences({
      fieldName: "reviewVoteCount",
      collectionName: "Posts",
      foreignCollectionName: "ReviewVotes",
      foreignTypeName: "reviewVote",
      foreignFieldName: "postId",
    }),
    canRead: ['guests'],
  },

  positiveReviewVoteCount: {
    type: Number,
    optional: true,
    defaultValue: 0,
    ...denormalizedCountOfReferences({
      fieldName: "positiveReviewVoteCount",
      collectionName: "Posts",
      foreignCollectionName: "ReviewVotes",
      foreignTypeName: "reviewVote",
      foreignFieldName: "postId",
      filterFn: vote => vote.qualitativeScore > DEFAULT_QUALITATIVE_VOTE || vote.quadraticScore > 0
    }),
    canRead: ['guests'],
  },
  reviewVoteScoreAF: {
    type: Number, 
    optional: true,
    defaultValue: 0,
    canRead: ['guests']
  },
  reviewVotesAF: {
    type: Array,
    optional: true,
    defaultValue: [],
    canRead: ['guests']
  },
  'reviewVotesAF.$': {
    type: Number,
    optional: true,
  },

  reviewVoteScoreHighKarma: {
    type: Number, 
    optional: true,
    defaultValue: 0,
    canRead: ['guests']
  },
  reviewVotesHighKarma: {
    type: Array,
    optional: true,
    defaultValue: [],
    canRead: ['guests']
  },
  'reviewVotesHighKarma.$': {
    type: Number,
    optional: true,
  },

  reviewVoteScoreAllKarma: {
    type: Number, 
    optional: true,
    defaultValue: 0,
    canRead: ['guests']
  },
  reviewVotesAllKarma: {
    type: Array,
    optional: true,
    defaultValue: [],
    canRead: ['guests']
  },
  'reviewVotesAllKarma.$': {
    type: Number,
    optional: true,
  },

  lastCommentPromotedAt: {
    type: Date,
    optional: true,
    hidden: true,
    canRead: ['guests']
  },

  tagRel: resolverOnlyField({
    type: "TagRel",
    graphQLtype: "TagRel",
    viewableBy: ['guests'],
    graphqlArguments: 'tagId: String',
    resolver: async (post: DbPost, args: {tagId: string}, context: ResolverContext) => {
      const { tagId } = args;
      const { currentUser } = context;
      const tagRels = await getWithLoader(context, TagRels,
        "tagRelByDocument",
        {
          tagId: tagId
        },
        'postId', post._id
      );
      const filteredTagRels = await accessFilterMultiple(currentUser, TagRels, tagRels, context)
      if (filteredTagRels?.length) {
        return filteredTagRels[0]
      }
    }
  }),

  tags: resolverOnlyField({
    type: "[Tag]",
    graphQLtype: "[Tag]",
    viewableBy: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const { currentUser } = context;
      const tagRelevanceRecord:Record<string, number> = post.tagRelevance || {}
      const tagIds = Object.entries(tagRelevanceRecord).filter(([id, score]) => score && score > 0).map(([id]) => id)
      const tags = await context.loaders.Tags.loadMany(tagIds)
      return await accessFilterMultiple(currentUser, context.Tags, tags, context)
    }
  }),
  
  // Denormalized, with manual callbacks. Mapping from tag ID to baseScore, ie Record<string,number>.
  tagRelevance: {
    type: Object,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
  },
  
  "tagRelevance.$": {
    type: Number,
    optional: true,
    hidden: true,
  },

  lastPromotedComment: resolverOnlyField({
    type: "Comment",
    graphQLtype: "Comment",
    viewableBy: ['guests'],
    resolver: async (post, args, context: ResolverContext) => {
      const { currentUser, Comments } = context;
      if (post.lastCommentPromotedAt) {
        const comment = await Comments.findOne({postId: post._id, promoted: true}, {sort:{promotedAt: -1}})
        return await accessFilterSingle(currentUser, Comments, comment, context)
      }
    }
  }),

  bestAnswer: resolverOnlyField({
    type: "Comment",
    graphQLtype: "Comment",
    viewableBy: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const { currentUser, Comments } = context;
      if (post.question) {
        if (post.lastCommentPromotedAt) {
          const comment = await Comments.findOne({postId: post._id, answer: true, promoted: true}, {sort:{promotedAt: -1}})
          return await accessFilterSingle(currentUser, Comments, comment, context)
        } else {
          const comment = await Comments.findOne({postId: post._id, answer: true, baseScore: {$gt: 15}}, {sort:{baseScore: -1}})
          return await accessFilterSingle(currentUser, Comments, comment, context)
        }
      }
    }
  }),

  // Tell search engines not to index this post. Useful for old posts that were
  // from a time with different quality standards. Posts will still be findable
  // in algolia. See PostsPage and HeadTags for their use of this field and the
  // noIndexLowKarma migration for the setting of it.
  noIndex: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },
  
  // TODO: doc
  rsvps: {
    type: Array,
    viewableBy: ['guests'],
    optional: true,
    // TODO: how to remove people without db access?
    hidden: true,
  },
  
  'rsvps.$': {
    type: rsvpType,
    viewableBy: ['guests'],
  },

  activateRSVPs: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    hidden: (props) => !props.eventForm,
    group: formGroups.event,
    control: 'checkbox',
    label: "Enable RSVPs for this event",
    tooltip: "RSVPs are public, but the associated email addresses are only visible to organizers.",
    optional: true
  },
  
  nextDayReminderSent: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    optional: true,
    hidden: true,
    ...schemaDefaultValue(false),
  },
  
  onlyVisibleToLoggedIn: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    optional: true,
    group: formGroups.adminOptions,
    label: "Hide this post from users who are not logged in",
    ...schemaDefaultValue(false),
  },
  
  onlyVisibleToEstablishedAccounts: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    optional: true,
    group: formGroups.adminOptions,
    label: "Hide this post from logged out users and newly created accounts",
    ...schemaDefaultValue(false),
  },

  currentUserReviewVote: resolverOnlyField({
    type: "ReviewVote",
    graphQLtype: "ReviewVote",
    viewableBy: ['members'],
    resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<DbReviewVote|null> => {
      const { ReviewVotes, currentUser } = context;
      if (!currentUser) return null;
      const votes = await getWithLoader(context, ReviewVotes,
        `reviewVotesByUser${currentUser._id}`,
        {
          userId: currentUser._id
        },
        "postId", post._id
      );
      if (!votes.length) return null;
      const vote = await accessFilterSingle(currentUser, ReviewVotes, votes[0], context);
      return vote;
    }
  }),
  
  votingSystem: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    control: "select",
    form: {
      options: () => {
        return getVotingSystems()
          .map(votingSystem => ({label: votingSystem.description, value: votingSystem.name}));
      }
    },
  },
};

export default schema;
