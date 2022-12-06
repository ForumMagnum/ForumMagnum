import { Utils, slugify, getDomain, getOutgoingUrl } from '../../vulcan-lib/utils';
import moment from 'moment';
import { arrayOfForeignKeysField, foreignKeyField, googleLocationToMongoLocation, resolverOnlyField, denormalizedField, denormalizedCountOfReferences, accessFilterMultiple, accessFilterSingle } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';
import { PostRelations } from "../postRelations/collection"
import { postCanEditHideCommentKarma, postGetPageUrl, postGetEmailShareUrl, postGetTwitterShareUrl, postGetFacebookShareUrl, postGetDefaultStatus, getSocialPreviewImage, canUserEditPostMetadata } from './helpers';
import { postStatuses, postStatusLabels } from './constants';
import { userGetDisplayNameById } from '../../vulcan-users/helpers';
import { TagRels } from "../tagRels/collection";
import { getWithLoader } from '../../loaders';
import { formGroups } from './formGroups';
import SimpleSchema from 'simpl-schema'
import { DEFAULT_QUALITATIVE_VOTE } from '../reviewVotes/schema';
import { getCollaborativeEditorAccess } from './collabEditingPermissions';
import { getVotingSystems } from '../../voting/votingSystems';
import { fmCrosspostBaseUrlSetting, fmCrosspostSiteNameSetting, forumTypeSetting } from '../../instanceSettings';
import { forumSelect } from '../../forumTypeUtils';
import GraphQLJSON from 'graphql-type-json';
import * as _ from 'underscore';
import { localGroupTypeFormOptions } from '../localgroups/groupTypes';
import { userOwns } from '../../vulcan-users/permissions';
import { userCanCommentLock, userCanModeratePost, userIsSharedOn } from '../users/helpers';
import { sequenceGetNextPostID, sequenceGetPrevPostID, sequenceContainsPost, getPrevPostIdFromPrevSequence, getNextPostIdFromNextSequence } from '../sequences/helpers';
import { captureException } from '@sentry/core';
import { userOverNKarmaFunc } from "../../vulcan-users";
import { getSqlClientOrThrow } from '../../sql/sqlClient';
import { allOf } from '../../utils/functionUtils';
import { crosspostKarmaThreshold } from '../../publicSettings';
import { userHasSideComments } from '../../betas';

const isEAForum = (forumTypeSetting.get() === 'EAForum')

const urlHintText = isEAForum
    ? 'UrlHintText'
    : 'Please write what you liked about the post and sample liberally! If the author allows it, copy in the entire post text. (Link-posts without text get far fewer views and most people don\'t click offsite links.)'

const STICKY_PRIORITIES = {
  1: "Low",
  2: "Normal",
  3: "Elevated",
  4: "Max",
}

const forumDefaultVotingSystem = forumSelect({
  EAForum: "twoAxis",
  LessWrong: "twoAxis",
  AlignmentForum: "twoAxis",
  default: "default",
})

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
    nullable: true
  },
  createdAt: {
    type: Date,
    optional: true
  },
})

const MINIMUM_COAUTHOR_KARMA = 10;

export const EVENT_TYPES = [
  {value: 'presentation', label: 'Presentation'},
  {value: 'discussion', label: 'Discussion'},
  {value: 'workshop', label: 'Workshop'},
  {value: 'social', label: 'Social'},
  {value: 'coworking', label: 'Coworking'},
  {value: 'course', label: 'Course'},
  {value: 'conference', label: 'Conference'},
]

function eaFrontpageDate (document: ReplaceFieldsOfType<DbPost, EditableFieldContents, EditableFieldInsertion>) {
  if (document.isEvent || !document.submitToFrontpage) {
    return undefined
  }
  return new Date()
}
const frontpageDefault = isEAForum ?
  eaFrontpageDate :
  undefined

export const sideCommentCacheVersion = 1;
export interface SideCommentsCache {
  version: number,
  generatedAt: Date,
  annotatedHtml: string
  commentsByBlock: Record<string,string[]>
}
export interface SideCommentsResolverResult {
  html: string,
  commentsByBlock: Record<string,string[]>,
  highKarmaCommentsByBlock: Record<string,string[]>,
}

/**
 * Structured this way to ensure lazy evaluation of `crosspostKarmaThreshold` each time we check for a given user, rather than once on server start
 */
const userPassesCrosspostingKarmaThreshold = (user: DbUser | UsersMinimumInfo | null) => {
  const currentKarmaThreshold = crosspostKarmaThreshold.get();

  return currentKarmaThreshold === null
    ? true
    // userOverNKarmaFunc checks greater than, while we want greater than or equal to, since that's the check we're performing elsewhere
    // so just subtract one
    : userOverNKarmaFunc(currentKarmaThreshold - 1)(user);
}

const schema: SchemaType<DbPost> = {
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
    inputProperties: {
      labels: {
        inactive: 'Link-post?',
        active: 'Add a linkpost URL',
      },
      hintText: urlHintText
    },
    group: formGroups.options,
    hidden: (props) => props.eventForm,
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
    group: formGroups.title,
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
    insertableBy: ['sunshineRegiment', 'admins'],
    editableBy: ['sunshineRegiment', 'admins'],
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
    insertableBy: ['sunshineRegiment', 'admins'],
    editableBy: ['sunshineRegiment', 'admins'],
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

  // By default, the read time for a post is calculated automatically from the word count.
  // Sometimes this incorrect (often due to link posts, videos, etc.) so it can be overridden
  // manually by setting this field.
  readTimeMinutesOverride: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    group: formGroups.adminOptions,
    control: 'FormComponentNumber',
    label: 'Read time (minutes)',
    tooltip: 'By default, this is calculated from the word count. Enter a value to override.',
  },
  readTimeMinutes: resolverOnlyField({
    type: Number,
    viewableBy: ['guests'],
    resolver: ({readTimeMinutesOverride, contents}: DbPost) =>
      Math.max(
        1,
        Math.round(typeof readTimeMinutesOverride === "number"
          ? readTimeMinutesOverride
          : (contents?.wordCount ?? 0) / 250)
      ),
  }),

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
      let postRelations: DbPostRelation[] = [];
      if (Posts.isPostgres()) {
        const sql = getSqlClientOrThrow();
        postRelations = await sql.any(`
          WITH RECURSIVE search_tree(
            "_id", "createdAt", "type", "sourcePostId", "targetPostId", "order", "schemaVersion", "depth"
          ) AS (
            SELECT "_id", "createdAt", "type", "sourcePostId", "targetPostId", "order", "schemaVersion", 1 AS depth
            FROM "PostRelations"
            WHERE "sourcePostId" = $1
            UNION
            SELECT source."_id", source."createdAt", source."type", source."sourcePostId", source."targetPostId",
              source."order", source."schemaVersion", target.depth + 1 AS depth
            FROM "PostRelations" source
            JOIN search_tree target ON source."sourcePostId" = target."targetPostId" AND target.depth < 3
          )
          SELECT * FROM search_tree;
        `, [post._id]);
      } else {
        postRelations = await Posts.aggregate([
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
      }
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

  // The various reviewVoteScore and reviewVotes fields are for caching the results of the updateQuadraticVotes migration (which calculates the score of posts during the LessWrong Review)
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
  // Results (sum) of the quadratic votes when filtering only for users with >1000 karma
  reviewVoteScoreHighKarma: {
    type: Number, 
    optional: true,
    defaultValue: 0,
    canRead: ['guests']
  },
  // A list of each individual user's calculated quadratic vote, for users with >1000 karma
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
  // Results (sum) of the quadratic votes for all users
  reviewVoteScoreAllKarma: {
    type: Number, 
    optional: true,
    defaultValue: 0,
    canRead: ['guests']
  },
  // A list of each individual user's calculated quadratic vote, for all users
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

  // the final review scores for each post, at the end of the review.
  finalReviewVoteScoreHighKarma: {
    type: Number, 
    optional: true,
    defaultValue: 0,
    canRead: ['guests']
  },
  finalReviewVotesHighKarma: {
    type: Array,
    optional: true,
    defaultValue: [],
    canRead: ['guests']
  },
  'finalReviewVotesHighKarma.$': {
    type: Number,
    optional: true,
  },

  finalReviewVoteScoreAllKarma: {
    type: Number, 
    optional: true,
    defaultValue: 0,
    canRead: ['guests']
  },
  finalReviewVotesAllKarma: {
    type: Array,
    optional: true,
    defaultValue: [],
    canRead: ['guests']
  },
  'finalReviewVotesAllKarma.$': {
    type: Number,
    optional: true,
  },

  finalReviewVoteScoreAF: {
    type: Number, 
    optional: true,
    defaultValue: 0,
    canRead: ['guests']
  },
  finalReviewVotesAF: {
    type: Array,
    optional: true,
    defaultValue: [],
    canRead: ['guests']
  },
  'finalReviewVotesAF.$': {
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
  
  // Denormalized, with manual callbacks. Mapping from tag ID to baseScore, ie
  // Record<string,number>. If submitted as part of a new-post submission, the
  // submitter applies/upvotes relevance for any tags included as keys.
  tagRelevance: {
    type: Object,
    optional: true,
    insertableBy: ['members'],
    editableBy: [],
    viewableBy: ['guests'],
    
    blackbox: true,
    group: formGroups.tags,
    control: "FormComponentPostEditorTagging",
    hidden: (props) => props.eventForm,
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

  hideFromRecentDiscussions: {
    type: Boolean,
    optional: true,
    nullable: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.adminOptions,
    label: 'Hide this post from recent discussions',
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
    ...schemaDefaultValue(forumDefaultVotingSystem),
  },  
  myEditorAccess: resolverOnlyField({
    type: String,
    viewableBy: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      // We need access to the linkSharingKey field here, which the user (of course) does not have access to. 
      // Since the post at this point is already filtered by fields that this user has access, we have to grab
      // an unfiltered version of the post from cache
      const unfilteredPost = await context.loaders["Posts"].load(post._id)
      return getCollaborativeEditorAccess({
        formType: "edit",
        post: unfilteredPost, user: context.currentUser,
        context, 
        useAdminPowers: false,
      });
    }
  }),
  podcastEpisodeId: {
    ...foreignKeyField({
      idFieldName: 'podcastEpisodeId',
      resolverName: 'podcastEpisode',
      collectionName: 'PodcastEpisodes',
      type: 'PodcastEpisode',
      nullable: true
    }),
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'podcasters'],
    editableBy: ['admins', 'podcasters'],
    control: 'PodcastEpisodeInput',
    group: formGroups.audio,
    nullable: true
  },
  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
    type: Boolean,
    optional: true,
    hidden: false,
    defaultValue: false,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    control: "checkbox",
    order: 12,
    group: formGroups.adminOptions,
  },

  // Legacy ID: ID used in the original LessWrong database
  legacyId: {
    type: String,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  // Legacy Spam: True if the original post in the legacy LW database had this post
  // marked as spam
  legacySpam: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  // Feed Id: If this post was automatically generated by an integrated RSS feed
  // then this field will have the ID of the relevant feed
  feedId: {
    ...foreignKeyField({
      idFieldName: "feedId",
      resolverName: "feed",
      collectionName: "RSSFeeds",
      type: "RSSFeed",
      nullable: true,
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    group: formGroups.adminOptions,
  },

  // Feed Link: If this post was automatically generated by an integrated RSS feed
  // then this field will have the link to the original blogpost it was posted from
  feedLink: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    group: formGroups.adminOptions
  },
 

  // lastVisitedAt: If the user is logged in and has viewed this post, the date
  // they last viewed it. Otherwise, null.
  lastVisitedAt: resolverOnlyField({
    type: Date,
    viewableBy: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const { ReadStatuses, currentUser } = context;
      if (!currentUser) return null;

      const readStatus = await getWithLoader(context, ReadStatuses,
        `readStatuses`,
        { userId: currentUser._id },
        'postId', post._id
      );
      if (!readStatus.length) return null;
      return readStatus[0].lastUpdated;
    }
  }),
  
  isRead: resolverOnlyField({
    type: Boolean,
    viewableBy: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const { ReadStatuses, currentUser } = context;
      if (!currentUser) return false;
      
      const readStatus = await getWithLoader(context, ReadStatuses,
        `readStatuses`,
        { userId: currentUser._id },
        'postId', post._id
      );
      if (!readStatus.length) return false;
      return readStatus[0].isRead;
    }
  }),

  // curatedDate: Date at which the post was promoted to curated (null or false
  // if it never has been promoted to curated)
  curatedDate: {
    type: Date,
    control: 'datetime',
    optional: true,
    viewableBy: ['guests'],
    editableBy: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
    insertableBy: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
  },
  // metaDate: Date at which the post was marked as meta (null or false if it
  // never has been marked as meta)
  metaDate: {
    type: Date,
    control: 'datetime',
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['sunshineRegiment', 'admins'],
    editableBy: ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
  },
  suggestForCuratedUserIds: {
    // FIXME: client-side mutations of this are rewriting the whole thing,
    // when they should be doing add or delete. The current set up can cause
    // overwriting of other people's changes in a race.
    type: Array,
    viewableBy: ['members'],
    insertableBy: ['sunshineRegiment', 'admins', 'canSuggestCuration'],
    editableBy: ['sunshineRegiment', 'admins', 'canSuggestCuration'],
    optional: true,
    label: "Suggested for Curated by",
    control: "UsersListEditor",
    group: formGroups.adminOptions,
    resolveAs: {
      fieldName: 'suggestForCuratedUsernames',
      type: 'String',
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<string|null> => {
        // TODO - Turn this into a proper resolve field.
        // Ran into weird issue trying to get this to be a proper "users"
        // resolve field. Wasn't sure it actually needed to be anyway,
        // did a hacky thing.
        const users = await Promise.all(_.map(post.suggestForCuratedUserIds,
          async userId => {
            const user = await context.loaders.Users.load(userId)
            return user.displayName;
          }
        ))
        if (users.length) {
          return users.join(", ")
        } else {
          return null
        }
      },
      addOriginalField: true,
    }
  },
  'suggestForCuratedUserIds.$': {
    type: String,
    foreignKey: 'Users',
    optional: true,
  },

  // frontpageDate: Date at which the post was promoted to frontpage (null or
  // false if it never has been promoted to frontpage)
  frontpageDate: {
    type: Date,
    control: 'datetime',
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    onInsert: frontpageDefault, //TODO-JM: FIXME
    optional: true,
    hidden: true,
  },

  collectionTitle: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
  },

  coauthorStatuses: {
    type: Array,
    resolveAs: {
      fieldName: 'coauthors',
      type: '[User!]!',
      resolver: async (post: DbPost, args: void, context: ResolverContext) =>  {
        const loader = context.loaders['Users'];
        const resolvedDocs = await loader.loadMany(
          post.coauthorStatuses?.map(({ userId }) => userId) || []
        );
        return await accessFilterMultiple(context.currentUser, context['Users'], resolvedDocs, context);
      },
      addOriginalField: true,
    },
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins', userOverNKarmaFunc(MINIMUM_COAUTHOR_KARMA)],
    insertableBy: ['sunshineRegiment', 'admins', userOverNKarmaFunc(MINIMUM_COAUTHOR_KARMA)],
    optional: true,
    label: "Co-Authors",
    control: "CoauthorsListEditor",
    group: formGroups.coauthors,
  },
  'coauthorStatuses.$': {
    type: new SimpleSchema({
      userId: String,
      confirmed: Boolean,
      requested: Boolean,
    }),
    optional: true,
  },

  hasCoauthorPermission: {
    type: Boolean,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    optional: true,
    hidden: true,
    ...schemaDefaultValue(true),
  },

  // Cloudinary image id for an image that will be used as the OpenGraph image
  socialPreviewImageId: {
    type: String,
    optional: true,
    label: "Social Preview Image",
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    control: "ImageUpload",
    group: formGroups.advancedOptions,
    order: 4,
  },
  
  // Autoset OpenGraph image, derived from the first post image in a callback
  socialPreviewImageAutoUrl: {
    type: String,
    optional: true,
    hidden: true,
    label: "Social Preview Image Auto-generated URL",
    viewableBy: ['guests'],
    // TODO: should this be more restrictive?
    editableBy: ['members'],
    insertableBy: ['members'],
  },

  fmCrosspost: {
    type: new SimpleSchema({
      isCrosspost: Boolean,
      hostedHere: { type: Boolean, optional: true, nullable: true },
      foreignPostId: { type: String, optional: true, nullable: true },
    }),
    optional: true,
    nullable: true,
    viewableBy: ['guests'],
    editableBy: [allOf(userOwns, userPassesCrosspostingKarmaThreshold), 'admins'],
    insertableBy: [userPassesCrosspostingKarmaThreshold, 'admins'],
    control: "FMCrosspostControl",
    tooltip: fmCrosspostBaseUrlSetting.get()?.includes("forum.effectivealtruism.org") ?
      "The EA Forum is for discussions that are relevant to doing good effectively. If you're not sure what this means, consider exploring the Forum's Frontpage before posting on it." :
      undefined,
    group: formGroups.advancedOptions,
    order: 3,
    hidden: (props) => !fmCrosspostSiteNameSetting.get() || props.eventForm,
    ...schemaDefaultValue({
      isCrosspost: false,
    }),
  },

  canonicalSequenceId: {
    ...foreignKeyField({
      idFieldName: "canonicalSequenceId",
      resolverName: "canonicalSequence",
      collectionName: "Sequences",
      type: "Sequence",
      nullable: true,
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
    hidden: false,
    control: "text",
  },

  canonicalCollectionSlug: {
    type: String,
    foreignKey: {
      collection: 'Collections',
      field: 'slug'
    },
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    hidden: false,
    control: "text",
    group: formGroups.canonicalSequence,
    resolveAs: {
      fieldName: 'canonicalCollection',
      addOriginalField: true,
      type: "Collection",
      // TODO: Make sure we run proper access checks on this. Using slugs means it doesn't
      // work out of the box with the id-resolver generators
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<DbCollection|null> => {
        if (!post.canonicalCollectionSlug) return null;
        const collection = await context.Collections.findOne({slug: post.canonicalCollectionSlug})
        return await accessFilterSingle(context.currentUser, context.Collections, collection, context);
      }
    },
  },

  canonicalBookId: {
    ...foreignKeyField({
      idFieldName: "canonicalBookId",
      resolverName: "canonicalBook",
      collectionName: "Books",
      type: "Book",
      nullable: true,
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
    hidden: false,
    control: "text",
  },

  canonicalNextPostSlug: {
    type: String,
    foreignKey: {
      collection: "Posts",
      field: 'slug',
    },
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
    hidden: false,
    control: "text"
  },

  canonicalPrevPostSlug: {
    type: String,
    foreignKey: {
      collection: "Posts",
      field: 'slug',
    },
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
    hidden: false,
    control: "text"
  },

  /**
   * The next post. If a sequenceId is provided, that sequence must contain this
   * post, and this returns the next post after this one in that sequence.  If
   * there is no next post in the same sequence, we check if this sequence is in a
   * collection, and if there's a next sequence after this one.  If so, return the
   * first post in the next sequence. If no sequenceId is provided, uses this post's canonical sequence.
   */
  nextPost: resolverOnlyField({
    type: "Post",
    graphQLtype: "Post",
    viewableBy: ['guests'],
    graphqlArguments: 'sequenceId: String',
    resolver: async (post: DbPost, args: {sequenceId: string}, context: ResolverContext) => {
      const { sequenceId } = args;
      const { currentUser, Posts } = context;
      if (sequenceId) {
        const nextPostID = await sequenceGetNextPostID(sequenceId, post._id, context);
        if (nextPostID) {
          const nextPost = await context.loaders.Posts.load(nextPostID);
          return accessFilterSingle(currentUser, Posts, nextPost, context);
        } else {
          const nextSequencePostIdTuple = await getNextPostIdFromNextSequence(sequenceId, post._id, context);
          if (!nextSequencePostIdTuple) {
            return null;
          }

          const nextPost = await context.loaders.Posts.load(nextSequencePostIdTuple.postId);
          return accessFilterSingle(currentUser, Posts, nextPost, context);
        }
      }
      if(post.canonicalSequenceId) {
        const nextPostID = await sequenceGetNextPostID(post.canonicalSequenceId, post._id, context);
        if (nextPostID) {
          const nextPost = await context.loaders.Posts.load(nextPostID);
          const nextPostFiltered = await accessFilterSingle(currentUser, Posts, nextPost, context);
          if (nextPostFiltered)
            return nextPostFiltered;
        }
      }
      if (post.canonicalNextPostSlug) {
        const nextPost = await Posts.findOne({ slug: post.canonicalNextPostSlug });
        const nextPostFiltered = await accessFilterSingle(currentUser, Posts, nextPost, context);
        if (nextPostFiltered)
          return nextPostFiltered;
      }

      return null;
    }
  }),

  /**
   * The previous post. If a sequenceId is provided, that sequence must contain
   * this post, and this returns the post before this one in that sequence. If
   * there is no previous post in the same sequence, we check if this sequence is in a
   * collection, and if there's a previous sequence before this one.  If so, return the
   * last post in the previous sequence. If no sequenceId is provided, uses this post's canonical sequence.
   */
  prevPost: resolverOnlyField({
    type: "Post",
    graphQLtype: "Post",
    viewableBy: ['guests'],
    graphqlArguments: 'sequenceId: String',
    resolver: async (post: DbPost, args: {sequenceId: string}, context: ResolverContext) => {
      const { sequenceId } = args;
      const { currentUser, Posts } = context;
      if (sequenceId) {
        const prevPostID = await sequenceGetPrevPostID(sequenceId, post._id, context);
        if (prevPostID) {
          const prevPost = await context.loaders.Posts.load(prevPostID);
          return accessFilterSingle(currentUser, Posts, prevPost, context);
        } else {
          const prevSequencePostIdTuple = await getPrevPostIdFromPrevSequence(sequenceId, post._id, context);
          if (!prevSequencePostIdTuple) {
            return null;
          }

          const prevPost = await context.loaders.Posts.load(prevSequencePostIdTuple.postId);
          return accessFilterSingle(currentUser, Posts, prevPost, context);
        }
      }
      if(post.canonicalSequenceId) {
        const prevPostID = await sequenceGetPrevPostID(post.canonicalSequenceId, post._id, context);
        if (prevPostID) {
          const prevPost = await context.loaders.Posts.load(prevPostID);
          const prevPostFiltered = await accessFilterSingle(currentUser, Posts, prevPost, context);
          if (prevPostFiltered) {
            return prevPostFiltered;
          }
        }
      }
      if (post.canonicalPrevPostSlug) {
        const prevPost = await Posts.findOne({ slug: post.canonicalPrevPostSlug });
        const prevPostFiltered = await accessFilterSingle(currentUser, Posts, prevPost, context);
        if (prevPostFiltered) {
          return prevPostFiltered;
        }
      }

      return null;
    }
  }),

  /**
   * A sequence this post is part of. Takes an optional sequenceId and an optional
   * flag indicating whether we're in the context of a "next" or "previous" post;
   * if the sequenceId is given and it contains this post, returns that sequence.
   * If it doesn't contain this post, and we have a prevOrNext flag, check the
   * previous or next sequence (as requested) for this post, and return it if
   * it's part of that sequence, return the sequence. Otherwise, if this post
   * has a canonical sequence, return that. If no sequence ID is given and
   * there is no canonical sequence for this post, returns null.
   */
  sequence: resolverOnlyField({
    type: "Sequence",
    graphQLtype: "Sequence",
    viewableBy: ['guests'],
    graphqlArguments: 'sequenceId: String, prevOrNext: String',
    resolver: async (post: DbPost, args: {sequenceId: string, prevOrNext?: 'prev' | 'next'}, context: ResolverContext) => {
      const { sequenceId, prevOrNext } = args;
      const { currentUser } = context;
      let sequence: DbSequence|null = null;
      if (sequenceId && await sequenceContainsPost(sequenceId, post._id, context)) {
        sequence = await context.loaders.Sequences.load(sequenceId);
      } else if (sequenceId && prevOrNext) {
        const sequencePostIdTuple = prevOrNext === 'prev'
          ? await getPrevPostIdFromPrevSequence(sequenceId, post._id, context)
          : await getNextPostIdFromNextSequence(sequenceId, post._id, context);

        if (sequencePostIdTuple) {
          sequence = await context.loaders.Sequences.load(sequencePostIdTuple.sequenceId);
        }
      } else if (!sequence && post.canonicalSequenceId) {
        sequence = await context.loaders.Sequences.load(post.canonicalSequenceId);
      }

      return await accessFilterSingle(currentUser, context.Sequences, sequence, context);
    }
  }),

  // unlisted: If true, the post is not featured on the frontpage and is not
  // featured on the user page. Only accessible via it's ID
  unlisted: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    label: "Make only accessible via link",
    control: "checkbox",
    order: 11,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  // disableRecommendation: If true, this post will never appear as a
  // recommended post (but will still appear in all other places, ie on its
  // author's profile, in archives, etc).
  // Use for things that lose their relevance with age, like announcements, or
  // for things that aged poorly, like results that didn't replicate.
  disableRecommendation: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    label: "Exclude from Recommendations",
    control: "checkbox",
    order: 12,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  // defaultRecommendation: If true, always include this post in the recommendations
  defaultRecommendation: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    label: "Include in default recommendations",
    control: "checkbox",
    order: 13,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  // Drafts
  draft: {
    label: 'Save to Drafts',
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    hidden: true,
  },


  // meta: The post is published to the meta section of the page
  meta: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    hidden: true,
    label: "Publish to meta",
    control: "checkbox",
    ...schemaDefaultValue(false)
  },

  hideFrontpageComments: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    control: 'checkbox',
    group: formGroups.moderationGroup,
    ...schemaDefaultValue(false),
  },

  // maxBaseScore: Highest baseScore this post ever had, used for RSS feed generation
  maxBaseScore: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    hidden: true,
    onInsert: (document) => document.baseScore || 0,
  },
  // The timestamp when the post's maxBaseScore first exceeded 2
  scoreExceeded2Date: {
    type: Date,
    optional: true,
    nullable: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 2 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 30
  scoreExceeded30Date: {
    type: Date,
    optional: true,
    nullable: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 30 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 45
  scoreExceeded45Date: {
    type: Date,
    optional: true,
    nullable: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 45 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 75
  scoreExceeded75Date: {
    type: Date,
    optional: true,
    nullable: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 75 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 125
  scoreExceeded125Date: {
    type: Date,
    optional: true,
    nullable: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 125 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 200
  scoreExceeded200Date: {
    type: Date,
    optional: true,
    nullable: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 200 ? new Date() : null
  },
  bannedUserIds: {
    type: Array,
    viewableBy: ['guests'],
    group: formGroups.moderationGroup,
    insertableBy: [userCanModeratePost],
    editableBy: ['sunshineRegiment', 'admins'],
    hidden: true,
    optional: true,
    // label: "Users banned from commenting on this post",
    // control: "UsersListEditor",
  },
  'bannedUserIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true
  },
  commentsLocked: {
    type: Boolean,
    viewableBy: ['guests'],
    group: formGroups.moderationGroup,
    insertableBy: (currentUser: DbUser|null) => userCanCommentLock(currentUser, null),
    editableBy: (currentUser: DbUser|null, document: DbPost) => userCanCommentLock(currentUser, document),
    optional: true,
    control: "checkbox",
  },
  commentsLockedToAccountsCreatedAfter: {
    type: Date,
    control: 'datetime',
    viewableBy: ['guests'],
    group: formGroups.moderationGroup,
    insertableBy: (currentUser: DbUser|null) => userCanCommentLock(currentUser, null),
    editableBy: (currentUser: DbUser|null, document: DbPost) => userCanCommentLock(currentUser, document),
    optional: true,
  },

  // Event specific fields:
  /////////////////////////////////////////////////////////////////////////////

  organizerIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "organizerIds",
      resolverName: "organizers",
      collectionName: "Users",
      type: "User"
    }),
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: true,
    control: "UsersListEditor",
    group: formGroups.event,
  },

  'organizerIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true,
  },

  groupId: {
    ...foreignKeyField({
      idFieldName: "groupId",
      resolverName: "group",
      collectionName: "Localgroups",
      type: "Localgroup",
      nullable: true,
    }),
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    optional: true,
    order: 1,
    control: 'SelectLocalgroup',
    label: 'Group',
    group: formGroups.event,
    hidden: (props) => !props.eventForm,
  },
  
  eventType: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    hidden: (props) => !props.eventForm,
    control: 'select',
    group: formGroups.event,
    optional: true,
    order: 2,
    label: 'Event Format',
    form: {
      options: EVENT_TYPES
    },
  },

  isEvent: {
    type: Boolean,
    hidden: true,
    group: formGroups.event,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['members'],
    optional: true,
    ...schemaDefaultValue(false),
    
    onCreate: ({newDocument}: {newDocument: DbInsertion<DbPost>}) => {
      // HACK: This replaces the `onCreate` that normally comes with
      // `schemaDefaultValue`. In addition to enforcing that the field must
      // be present (not undefined), it also enforces that it cannot be null.
      // There is a bug where GreaterWrong somehow submits posts with isEvent
      // set to null (instead of false), which causes some post-views to filter
      // it out (because they filter for non-events using isEvent:false which
      // does not match null).
      if (newDocument.isEvent===undefined || newDocument.isEvent===null)
        return false;
      else
        return undefined;
    }
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
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    hidden: true,
  },

  reviewForCuratedUserId: {
    type: String,
    foreignKey: "Users",
    optional: true,
    viewableBy: ['guests'],
    editableBy: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
    insertableBy: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
    label: "Curated Review UserId"
  },

  startTime: {
    type: Date,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    control: 'datetime',
    label: "Start Time",
    group: formGroups.event,
    optional: true,
    nullable: true,
    tooltip: 'For courses/programs, this is the application deadline.'
  },

  localStartTime: {
    type: Date,
    viewableBy: ['guests'],
  },

  endTime: {
    type: Date,
    hidden: (props) => !props.eventForm || props.document.eventType === 'course',
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    control: 'datetime',
    label: "End Time",
    group: formGroups.event,
    optional: true,
    nullable: true,
  },

  localEndTime: {
    type: Date,
    viewableBy: ['guests'],
  },
  
  eventRegistrationLink: {
    type: String,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Event Registration Link",
    control: "MuiTextField",
    optional: true,
    group: formGroups.event,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://...'
  },
  
  joinEventLink: {
    type: String,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Join Online Event Link",
    control: "MuiTextField",
    optional: true,
    group: formGroups.event,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://...'
  },

  onlineEvent: {
    type: Boolean,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    optional: true,
    group: formGroups.event,
    order: 0,
    ...schemaDefaultValue(false),
  },
  
  globalEvent: {
    type: Boolean,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    optional: true,
    group: formGroups.event,
    label: "This event is intended for a global audience",
    tooltip: 'By default, events are only advertised to people who are located nearby (for both in-person and online events). Check this to advertise it people located anywhere.',
    ...schemaDefaultValue(false),
  },

  mongoLocation: {
    type: Object,
    viewableBy: ['guests'],
    hidden: true,
    blackbox: true,
    optional: true,
    ...denormalizedField({
      needsUpdate: data => ('googleLocation' in data),
      getValue: async (post) => {
        if (post.googleLocation) return googleLocationToMongoLocation(post.googleLocation)
        return null
      }
    }),
  },

  googleLocation: {
    type: Object,
    form: {
      stringVersionFieldName: "location",
    },
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    label: "Event Location",
    control: 'LocationFormComponent',
    blackbox: true,
    group: formGroups.event,
    optional: true
  },

  location: {
    type: String,
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    hidden: true,
    optional: true
  },

  contactInfo: {
    type: String,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Contact Info",
    control: "MuiTextField",
    optional: true,
    group: formGroups.event,
  },

  facebookLink: {
    type: String,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    label: "Facebook Event",
    control: "MuiTextField",
    optional: true,
    group: formGroups.event,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://www.facebook.com/events/...'
  },
  
  meetupLink: {
    type: String,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    label: "Meetup.com Event",
    control: "MuiTextField",
    optional: true,
    group: formGroups.event,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://www.meetup.com/...'
  },

  website: {
    type: String,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    control: "MuiTextField",
    optional: true,
    group: formGroups.event,
    regEx: SimpleSchema.RegEx.Url,
    tooltip: 'https://...'
  },
  
  eventImageId: {
    type: String,
    optional: true,
    hidden: (props) => !props.eventForm || !isEAForum,
    label: "Event Image",
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    control: "ImageUpload",
    group: formGroups.event,
    tooltip: "Recommend 1920x1080 px, 16:9 aspect ratio (same as Facebook)"
  },

  types: {
    type: Array,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    hidden: (props) => isEAForum || !props.eventForm,
    control: 'MultiSelectButtons',
    label: "Group Type:",
    group: formGroups.event,
    optional: true,
    form: {
      options: localGroupTypeFormOptions
    },
  },

  'types.$': {
    type: String,
    optional: true,
  },

  metaSticky: {
    order:10,
    type: Boolean,
    optional: true,
    label: "Sticky (Meta)",
    ...schemaDefaultValue(false),
    group: formGroups.adminOptions,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    control: 'checkbox',
    onInsert: (post) => {
      if(!post.metaSticky) {
        return false;
      }
    },
    onEdit: (modifier, post) => {
      if (!modifier.$set.metaSticky) {
        return false;
      }
    }
  },

  sharingSettings: {
    type: Object,
    order: 15,
    viewableBy: ['guests'],
    editableBy: [userOwns, 'admins'],
    insertableBy: ['members'],
    optional: true,
    control: "PostSharingSettings",
    label: "Sharing Settings",
    group: formGroups.options,
    blackbox: true,
  },
  
  shareWithUsers: {
    type: Array,
    order: 15,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: true, 
  },

  'shareWithUsers.$': {
    type: String,
    foreignKey: "Users",
    optional: true
  },
  
  // linkSharingKey: An additional ID for this post which is used for link-sharing,
  // and not made accessible to people who merely have access to the published version
  // of a post. Only populated if some form of link sharing is (or has been) enabled.
  linkSharingKey: {
    type: String,
    viewableBy: [userOwns, 'admins'],
    editableBy: ['admins'],
    optional: true,
    nullable: true,
    hidden: true,
  },

  // linkSharingKeyUsedBy: An array of user IDs who have used the link-sharing key
  // to unlock access.
  linkSharingKeyUsedBy: {
    type: Array,
    viewableBy: ['admins'],
    optional: true,
    hidden: true,
  },
  'linkSharingKeyUsedBy.$': {
    type: String,
    foreignKey: "Users",
    optional: true
  },
  
  
  commentSortOrder: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    optional: true,
    group: formGroups.adminOptions,
  },

  // hideAuthor: Post stays online, but doesn't show on your user profile anymore, and doesn't
  // link back to your account
  hideAuthor: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    optional: true,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  tableOfContents: {
    type: Object,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    // Implementation in postResolvers.ts
  },

  tableOfContentsRevision: {
    type: Object,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    // Implementation in postResolvers.ts
  },
  
  sideComments: {
    type: Object,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    // Implementation in postResolvers.ts
  },
  
  // sideCommentsCache: Stores the matching between comments on a post,
  // and paragraph IDs within the post. Invalid if the cache-generation
  // time is older than when the post was last modified (modifiedAt) or
  // commented on (lastCommentedAt).
  // SideCommentsCache
  sideCommentsCache: {
    type: Object,
    viewableBy: ['admins'], //doesn't need to be publicly readable because it's internal to the sideComments resolver
    optional: true, nullable: true, hidden: true,
  },
  
  sideCommentVisibility: {
    type: String,
    optional: true,
    control: "select",
    group: formGroups.advancedOptions,
    hidden: (props) => props.eventForm || !userHasSideComments(props.currentUser),
    
    label: "Replies in sidebar",
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['members', 'sunshineRegiment', 'admins'],
    blackbox: true,
    form: {
      options: () => {
        return [
          {value: "highKarma", label: "10+ karma (default)"},
          {value: "hidden", label: "Hide all"},
        ];
      }
    },
  },

  // GraphQL only field that resolves based on whether the current user has closed
  // this posts author's moderation guidelines in the past
  showModerationGuidelines: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      type: 'Boolean',
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<boolean> => {
        const { LWEvents, currentUser } = context;
        if(currentUser){
          const query = {
            name:'toggled-user-moderation-guidelines',
            documentId: post.userId,
            userId: currentUser._id
          }
          const sort = {sort:{createdAt:-1}}
          const event = await LWEvents.findOne(query, sort);
          const author = await context.Users.findOne({_id: post.userId});
          if (event) {
            return !!(event.properties && event.properties.targetState)
          } else {
            return !!(author?.collapseModerationGuidelines ? false : ((post.moderationGuidelines && post.moderationGuidelines.html) || post.moderationStyle))
          }
        } else {
          return false
        }
      },
      addOriginalField: false
    }
  },

  moderationStyle: {
    type: String,
    optional: true,
    control: "select",
    group: formGroups.moderationGroup,
    label: "Style",
    viewableBy: ['guests'],
    editableBy: ['members', 'sunshineRegiment', 'admins'],
    insertableBy: ['members', 'sunshineRegiment', 'admins'],
    blackbox: true,
    order: 55,
    form: {
      options: function () { // options for the select form control
        return [
          {value: "", label: "No Moderation"},
          {value: "easy-going", label: "Easy Going - I just delete obvious spam and trolling."},
          {value: "norm-enforcing", label: "Norm Enforcing - I try to enforce particular rules (see below)"},
          {value: "reign-of-terror", label: "Reign of Terror - I delete anything I judge to be annoying or counterproductive"},
        ];
      }
    },
  },
  
  // On a post, do not show comment karma
  hideCommentKarma: {
    type: Boolean,
    optional: true,
    group: formGroups.moderationGroup,
    viewableBy: ['guests'],
    insertableBy: ['admins', postCanEditHideCommentKarma],
    editableBy: ['admins', postCanEditHideCommentKarma],
    hidden: !isEAForum,
    denormalized: true,
    ...schemaDefaultValue(false),
  },

  commentCount: {
    type: Number,
    optional: true,
    defaultValue: 0,
    
    ...denormalizedCountOfReferences({
      fieldName: "commentCount",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: comment => !comment.deleted
    }),
    canRead: ['guests'],
  },
  
  recentComments: resolverOnlyField({
    type: Array,
    graphQLtype: "[Comment]",
    viewableBy: ['guests'],
    graphqlArguments: 'commentsLimit: Int, maxAgeHours: Int, af: Boolean',
    resolver: async (post: DbPost, args: {commentsLimit?: number, maxAgeHours?: number, af?: boolean}, context: ResolverContext) => {
      const { commentsLimit=5, maxAgeHours=18, af=false } = args;
      const { currentUser, Comments } = context;
      const timeCutoff = moment(post.lastCommentedAt).subtract(maxAgeHours, 'hours').toDate();
      const comments = await Comments.find({
        ...Comments.defaultView({}).selector,
        postId: post._id,
        score: {$gt:0},
        deletedPublic: false,
        postedAt: {$gt: timeCutoff},
        ...(af ? {af:true} : {}),
      }, {
        limit: commentsLimit,
        sort: {postedAt:-1}
      }).fetch();
      return await accessFilterMultiple(currentUser, Comments, comments, context);
    }
  }),
  'recentComments.$': {
    type: Object,
    foreignKey: 'Comments',
  },
  
  languageModelSummary: {
    type: String,
    optional: true,
    hidden: true,
    canRead: ['admins'],
    // Implementation in postSummaryResolver.ts
  },
};

/* subforum-related fields */
Object.assign(schema, {
  // If this post is associated with a subforum, the _id of the tag
  subforumTagId: {
    ...foreignKeyField({
      idFieldName: "subforumTagId",
      resolverName: "subforumTag",
      collectionName: "Tags",
      type: "Tag",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'], // TODO: maybe use userOwns, or actually maybe limit to subforum members
    canUpdate: ['admins'],
    hidden: true,
  },
})

/* Alignment Forum fields */
Object.assign(schema, {
  af: {
    order:10,
    type: Boolean,
    optional: true,
    label: "Alignment Forum",
    ...schemaDefaultValue(false),
    viewableBy: ['guests'],
    editableBy: ['alignmentForum'],
    insertableBy: ['alignmentForum'],
    control: 'checkbox',
    group: formGroups.options,
  },

  afDate: {
    order:10,
    type: Date,
    optional: true,
    label: "Alignment Forum",
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['alignmentForum'],
    insertableBy: ['alignmentForum'],
    group: formGroups.options,
  },

  afCommentCount: {
    ...denormalizedCountOfReferences({
      fieldName: "afCommentCount",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: (comment: DbComment) => comment.af && !comment.deleted,
    }),
    label: "Alignment Comment Count",
    viewableBy: ['guests'],
  },

  afLastCommentedAt: {
    type: Date,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    onInsert: () => new Date(),
  },

  afSticky: {
    order: 10,
    type: Boolean,
    optional: true,
    label: "Sticky (Alignment)",
    ...schemaDefaultValue(false),
    group: formGroups.adminOptions,
    hidden: forumTypeSetting.get() === 'EAForum',
    viewableBy: ['guests'],
    editableBy: ['alignmentForumAdmins', 'admins'],
    insertableBy: ['alignmentForumAdmins', 'admins'],
    control: 'checkbox',
    onInsert: (post: DbPost) => {
      if(!post.afSticky) {
        return false;
      }
    },
    onEdit: (modifier, post: DbPost) => {
      if (!(modifier.$set && modifier.$set.afSticky)) {
        return false;
      }
    }
  },

  suggestForAlignmentUserIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "suggestForAlignmentUserIds",
      resolverName: "suggestForAlignmentUsers",
      collectionName: "Users",
      type: "User"
    }),
    viewableBy: ['members'],
    insertableBy: ['members', 'sunshineRegiment', 'admins'],
    editableBy: ['members', 'alignmentForum', 'alignmentForumAdmins'],
    optional: true,
    hidden: true,
    label: "Suggested for Alignment by",
    control: "UsersListEditor",
    group: formGroups.adminOptions,
  },
  'suggestForAlignmentUserIds.$': {
    type: String,
    optional: true
  },

  reviewForAlignmentUserId: {
    type: String,
    optional: true,
    hidden: forumTypeSetting.get() === 'EAForum',
    viewableBy: ['guests'],
    editableBy: ['alignmentForumAdmins', 'admins'],
    insertableBy: ['alignmentForumAdmins', 'admins'],
    group: formGroups.adminOptions,
    label: "AF Review UserId"
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
