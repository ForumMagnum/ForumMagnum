import { getDomain, getOutgoingUrl } from '../../vulcan-lib/utils';
import moment from 'moment';
import { schemaDefaultValue, arrayOfForeignKeysField, foreignKeyField, googleLocationToMongoLocation, resolverOnlyField, denormalizedField, denormalizedCountOfReferences, accessFilterMultiple, accessFilterSingle } from '../../utils/schemaUtils'
import { PostRelations } from "../postRelations/collection"
import { postCanEditHideCommentKarma, postGetPageUrl, postGetEmailShareUrl, postGetTwitterShareUrl, postGetFacebookShareUrl, postGetDefaultStatus, getSocialPreviewImage, postCategories, postDefaultCategory } from './helpers';
import { postStatuses, postStatusLabels } from './constants';
import { userGetDisplayNameById } from '../../vulcan-users/helpers';
import { TagRels } from "../tagRels/collection";
import { loadByIds, getWithLoader, getWithCustomLoader } from '../../loaders';
import { formGroups } from './formGroups';
import SimpleSchema from 'simpl-schema'
import { DEFAULT_QUALITATIVE_VOTE } from '../reviewVotes/schema';
import { getCollaborativeEditorAccess } from './collabEditingPermissions';
import { getVotingSystems } from '../../voting/votingSystems';
import {
  eaFrontpageDateDefault,
  fmCrosspostBaseUrlSetting,
  fmCrosspostSiteNameSetting,
  forumTypeSetting,
  isEAForum,
  isLWorAF,
  requireReviewToFrontpagePostsSetting,
  reviewUserBotSetting,
} from '../../instanceSettings'
import { forumSelect } from '../../forumTypeUtils';
import * as _ from 'underscore';
import { localGroupTypeFormOptions } from '../localgroups/groupTypes';
import { documentIsNotDeleted, userOverNKarmaOrApproved, userOwns } from '../../vulcan-users/permissions';
import { userCanCommentLock, userCanModeratePost, userIsSharedOn } from '../users/helpers';
import { sequenceGetNextPostID, sequenceGetPrevPostID, sequenceContainsPost, getPrevPostIdFromPrevSequence, getNextPostIdFromNextSequence } from '../sequences/helpers';
import { userOverNKarmaFunc } from "../../vulcan-users";
import { allOf } from '../../utils/functionUtils';
import {crosspostKarmaThreshold} from '../../publicSettings'
import { getDefaultViewSelector } from '../../utils/viewUtils';
import GraphQLJSON from 'graphql-type-json';
import { addGraphQLSchema } from '../../vulcan-lib/graphql';
import SideCommentCaches from '../sideCommentCaches/collection';
import { hasSideComments, hasSidenotes, userCanCreateAndEditJargonTerms, userCanViewJargonTerms, userCanViewUnapprovedJargonTerms } from '../../betas';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { getPostReviewWinnerInfo } from '../reviewWinners/cache';
import { stableSortTags } from '../tags/helpers';
import { getLatestContentsRevision } from '../revisions/helpers';
import { marketInfoLoader } from './annualReviewMarkets';
import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';

// TODO: This disagrees with the value used for the book progress bar
export const READ_WORDS_PER_MINUTE = 250;

const urlHintText = isEAForum
    ? 'UrlHintText'
    : 'Please write what you liked about the post and sample liberally! If the author allows it, copy in the entire post text. (Link-posts without text get far fewer views and most people don\'t click offsite links.)'

const STICKY_PRIORITIES = {
  1: "Low",
  2: "Normal",
  3: "Elevated",
  4: "Max",
}

export function getDefaultVotingSystem() {
  return forumSelect({
    EAForum: "eaEmojis",
    LessWrong: "namesAttachedReactions",
    AlignmentForum: "namesAttachedReactions",
    default: "default",
  })
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
    nullable: true
  },
  createdAt: {
    type: Date,
    optional: true
  },
})

addGraphQLSchema(`
  type SocialPreviewType {
    _id: String
    imageId: String
    imageUrl: String
    text: String
  }
`)

export const MINIMUM_COAUTHOR_KARMA = 1;

export const EVENT_TYPES = [
  {value: 'presentation', label: 'Presentation'},
  {value: 'discussion', label: 'Discussion'},
  {value: 'workshop', label: 'Workshop'},
  {value: 'social', label: 'Social'},
  {value: 'coworking', label: 'Coworking'},
  {value: 'course', label: 'Course'},
  {value: 'conference', label: 'Conference'},
]

export async function getLastReadStatus(post: DbPost, context: ResolverContext) {
  const { currentUser, ReadStatuses } = context;
  if (!currentUser) return null;

  const readStatus = await getWithLoader(context, ReadStatuses,
    `readStatuses`,
    { userId: currentUser._id },
    'postId', post._id
  );
  if (!readStatus.length) return null;
  return readStatus[0];
}

export const sideCommentCacheVersion = 1;
export interface SideCommentsCache {
  version: number,
  createdAt: Date,
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

const schemaDefaultValueFmCrosspost = schemaDefaultValue({
  isCrosspost: false,
})

const schema: SchemaType<"Posts"> = {
  // Timestamp of post first appearing on the site (i.e. being approved)
  postedAt: {
    type: Date,
    optional: true,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'datetime',
    group: formGroups.adminOptions,
    onCreate: ({document: post, currentUser}) => {
      // Set the post's postedAt if it's going to be approved
      if (!post.postedAt && postGetDefaultStatus(currentUser!) === postStatuses.STATUS_APPROVED) {
        return new Date();
      }
    },
    onUpdate: ({modifier, newDocument: post}) => {
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
    canRead: ['guests'],
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
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    control: 'EditLinkpostUrl',
    order: 12,
    form: {
      labels: {
        inactive: 'Link-post?',
        active: 'Add a linkpost URL',
      },
      hintText: urlHintText
    },
    group: formGroups.options,
    hidden: (props) => props.eventForm || props.debateForm || props.collabEditorDialogue,
  },
  // Category (post, linkpost, or question)
  postCategory: {
    type: String,
    allowedValues: [...postCategories],
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    order: 9,
    group: formGroups.category,
    control: 'EditPostCategory',
    hidden: (props) => props.eventForm || props.debateForm || props.collabEditorDialogue,
    ...schemaDefaultValue(postDefaultCategory),
  },
  // Title
  title: {
    type: String,
    optional: false,
    nullable: false,
    max: 500,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    order: 10,
    placeholder: "Title",
    control: 'EditTitle',
    group: formGroups.title,
  },
  // Count of how many times the post's page was viewed
  viewCount: {
    type: Number,
    optional: true,
    nullable: false,
    canRead: ['admins'],
    ...schemaDefaultValue(0),
  },
  // Timestamp of the last comment
  lastCommentedAt: {
    type: Date,
    denormalized: true,
    optional: true,
    canRead: ['guests'],
    hidden: true,
    onCreate: ({document: post}) => post.postedAt || new Date(),
  },
  // Count of how many times the post's link was clicked
  clickCount: {
    type: Number,
    optional: true,
    nullable: false,
    canRead: ['admins'],
    ...schemaDefaultValue(0),
  },

  deletedDraft: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: ['members'],
    hidden: true,
    onUpdate: ({data, document, oldDocument, currentUser}) => {
      if (!currentUser?.isAdmin && oldDocument.deletedDraft && !document.deletedDraft) {
        throw new Error("You cannot un-delete posts");
      }
      return data.deletedDraft;
    },
  },

  // The post's status. One of pending (`1`), approved (`2`), rejected (`3`), spam (`4`) or deleted (`5`)
  status: {
    type: Number,
    optional: true,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins', 'sunshineRegiment'],
    control: 'select',
    onCreate: ({document, currentUser}) => {
      if (!document.status) {
        return postGetDefaultStatus(currentUser!);
      }
    },
    onUpdate: ({modifier, document, currentUser}) => {
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
    nullable: false,
    canRead: ['guests'],
    onCreate: ({document: post}) => {
      // Set the post's isFuture to true if necessary
      if (post.postedAt) {
        const postTime = new Date(post.postedAt).getTime();
        const currentTime = new Date().getTime() + 1000;
        return postTime > currentTime; // round up to the second
      } else {
        return false;
      }
    },
    onUpdate: ({modifier, newDocument: post}) => {
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
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    control: 'checkbox',
    order: 10,
    group: formGroups.adminOptions,
    onCreate: ({document: post}) => {
      if(!post.sticky) {
        return false;
      }
    },
    onUpdate: ({modifier}) => {
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
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
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
  // The post author's name
  author: {
    type: String,
    denormalized: true,
    optional: true,
    canRead: [documentIsNotDeleted],
    onUpdate: async ({modifier, document, currentUser}) => {
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
    nullable: false,
    control: 'text',
    canRead: [documentIsNotDeleted],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    tooltip: 'The user id of the author',
    
    group: formGroups.adminOptions,
  },

  // GraphQL-only fields

  domain: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => getDomain(post.url),
  }),

  pageUrl: resolverOnlyField({
    type: 'String',
    graphQLtype: 'String!',
    canRead: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext): string => postGetPageUrl(post, true),
  }),
  
  pageUrlRelative: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => postGetPageUrl(post, false),
  }),

  linkUrl: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => {
      return post.url ? getOutgoingUrl(post.url) : postGetPageUrl(post, true);
    },
  }),

  postedAtFormatted: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => {
      return moment(post.postedAt).format('dddd, MMMM Do YYYY');
    }
  }),

  emailShareUrl: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => postGetEmailShareUrl(post),
  }),

  twitterShareUrl: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => postGetTwitterShareUrl(post),
  }),

  facebookShareUrl: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => postGetFacebookShareUrl(post),
  }),

  // DEPRECATED: use socialPreview.imageUrl instead
  socialPreviewImageUrl: resolverOnlyField({
    type: String,
    canRead: ['guests'],
    resolver: (post: DbPost, args: void, context: ResolverContext) => getSocialPreviewImage(post)
  }),

  question: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    hidden: true,
  },

  authorIsUnreviewed: {
    type: Boolean,
    optional: true,
    denormalized: true,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
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
    graphQLtype: 'Int!',
    type: Number,
    canRead: ['guests'],
    resolver: async (post: DbPost, _args: void, context: ResolverContext) => {
      const normalizeValue = (value: number): number =>
        Math.max(1, Math.round(value));
      if (typeof post.readTimeMinutesOverride === "number") {
        return normalizeValue(post.readTimeMinutesOverride);
      }
      const revision = await getLatestContentsRevision(post, context);
      return revision?.wordCount
        ? normalizeValue(revision.wordCount / READ_WORDS_PER_MINUTE)
        : 1;
    },
    sqlResolver: ({field, join}) => join({
      table: "Revisions",
      type: "left",
      on: {_id: field("contents_latest")},
      resolver: (revisionsField) => `GREATEST(1, ROUND(COALESCE(
        ${field("readTimeMinutesOverride")},
        ${revisionsField("wordCount")}
      ) / ${READ_WORDS_PER_MINUTE}))`,
    }),
  }),

  // DEPRECATED field for GreaterWrong backwards compatibility
  wordCount: resolverOnlyField({
    type: Number,
    canRead: ['guests'],
    resolver: async (post: DbPost, _args: void, context: ResolverContext) => {
      const revision = await getLatestContentsRevision(post, context);
      return revision?.wordCount ?? 0;
    },
    sqlResolver: ({field, join}) => join({
      table: "Revisions",
      type: "left",
      on: {_id: field("contents_latest")},
      resolver: (revisionsField) => revisionsField("wordCount"),
    }),
  }),
  // DEPRECATED field for GreaterWrong backwards compatibility
  htmlBody: resolverOnlyField({
    type: String,
    canRead: [documentIsNotDeleted],
    resolver: async (post: DbPost, _args: void, context: ResolverContext) => {
      const revision = await getLatestContentsRevision(post, context);
      return revision?.html;
    },
    sqlResolver: ({field, join}) => join({
      table: "Revisions",
      type: "left",
      on: {_id: field("contents_latest")},
      resolver: (revisionsField) => revisionsField("html"),
    }),
  }),

  submitToFrontpage: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members', 'admins', 'sunshineRegiment'],
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

  // (I'm not totally sure but this is my understanding of what this field is for):
  // Back when we had a form where you could create a related question from a question post,
  // you could set this to true to prevent the related question from appearing on the frontpage.
  // Now that we've removed the form to create a related question, I think we can drop
  // this field entirely?
  hiddenRelatedQuestion: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members', 'admins', 'sunshineRegiment'],
    hidden: true,
    optional: true,
    ...schemaDefaultValue(false),
  },

  originalPostRelationSourceId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
  },

  sourcePostRelations: resolverOnlyField({
    type: Array,
    graphQLtype: '[PostRelation!]!',
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      if (!post.question) return [];

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
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      if (!post.question) return [];

      const {currentUser, repos} = context;
      const postRelations = await repos.postRelations.getPostRelationsByPostId(post._id);
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
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    denormalized: true,
    ...schemaDefaultValue(false),
  },

  canonicalSource: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
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

  manifoldReviewMarketId: {
    type: String,
    nullable: true,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    hidden: !isLWorAF,
    group: formGroups.adminOptions,
  },

  annualReviewMarketProbability: {
    type: Number,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    hidden: !isLWorAF
    // Implementation in postResolvers.ts TODO: migrate this and other annual review market resolvers into the schema, for nicer developer experience
  },
  annualReviewMarketIsResolved: {
    type: Boolean,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    hidden: !isLWorAF
    // Implementation in postResolvers.ts
  },
  annualReviewMarketYear: {
    type: Number,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    hidden: !isLWorAF
    // Implementation in postResolvers.ts
  },

  annualReviewMarketUrl: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: async (post: DbPost, args: void, context: ResolverContext) => {
        if (!isLWorAF) {
          return 0;
        }
        const market = await getWithCustomLoader(context, 'manifoldMarket', post._id, marketInfoLoader(context))
        return market?.url
      }
    },
    optional: true,
    nullable: true,
    canRead: ['guests'],
    hidden: !isLWorAF
  },

  // We get this to show up in the PostsEditForm by adding it to the addFields array
  // Trying to do that by having `canUpdate` doesn't work because it then tries to validate the jargon terms in the glossary, and barfs
  glossary: resolverOnlyField({
    type: Array,
    graphQLtype: '[JargonTerm!]!',
    optional: true,
    canRead: ['guests'],
    control: "GlossaryEditFormWrapper",
    group: formGroups.glossary,
    hidden: ({currentUser}) => !userCanCreateAndEditJargonTerms(currentUser),

    resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<Partial<DbJargonTerm>[]> => {
      // Forum-gating/beta-gating is done here, rather than just client side,
      // so that users don't have to download the glossary if it isn't going
      // to be displayed.
      if (!userCanViewJargonTerms(context.currentUser)) {
        return [];
      }

      const jargonTerms = await context.JargonTerms.find({ postId: post._id }, { sort: { term: 1 }}).fetch();

      return await accessFilterMultiple(context.currentUser, context.JargonTerms, jargonTerms, context);
    },
    sqlResolver: ({ field, currentUserField }) => `(
      SELECT ARRAY_AGG(ROW_TO_JSON(jt.*) ORDER BY jt."term" ASC)
      FROM "JargonTerms" jt
      WHERE jt."postId" = ${field('_id')}
      LIMIT 1
    )`
  }),
  
  'glossary.$': {
    type: Object,
    optional: true,
  },

  // The various reviewVoteScore and reviewVotes fields are for caching the results of the updateQuadraticVotes migration (which calculates the score of posts during the LessWrong Review)
  reviewVoteScoreAF: {
    type: Number, 
    optional: true,
    ...schemaDefaultValue(0),
    canRead: ['guests']
  },
  reviewVotesAF: {
    type: Array,
    optional: true,
    ...schemaDefaultValue([]),
    canRead: ['guests']
  },
  'reviewVotesAF.$': {
    type: Number,
    optional: true,
  },
  // Results (sum) of the quadratic votes when filtering only for users with >1000 karma
  // NOTE: as of the 2023 Review (in 2025), this is now used to store the voting power including
  // karma weighting (from the Strong Vote multiplier)
  reviewVoteScoreHighKarma: {
    type: Number, 
    optional: true,
    ...schemaDefaultValue(0),
    canRead: ['guests']
  },
  // A list of each individual user's calculated quadratic vote, for users with >1000 karma
  // NOTE: as of the 2023 Review (in 2025), this is now used to store the voting power including
  // karma weighting (from the Strong Vote multiplier)
  reviewVotesHighKarma: {
    type: Array,
    optional: true,
    ...schemaDefaultValue([]),
    canRead: ['guests']
  },
  'reviewVotesHighKarma.$': {
    type: Number,
    optional: true,
  },
  // Results (sum) of the quadratic votes for all users
  // uses the raw voting power, without karma multiplier
  reviewVoteScoreAllKarma: {
    type: Number, 
    optional: true,
    ...schemaDefaultValue(0),
    canRead: ['guests']
  },
  // A list of each individual user's calculated quadratic vote, for all users
  reviewVotesAllKarma: {
    type: Array,
    optional: true,
    ...schemaDefaultValue([]),
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
    ...schemaDefaultValue(0),
    canRead: ['guests']
  },
  finalReviewVotesHighKarma: {
    type: Array,
    optional: true,
    ...schemaDefaultValue([]),
    canRead: ['guests']
  },
  'finalReviewVotesHighKarma.$': {
    type: Number,
    optional: true,
  },

  finalReviewVoteScoreAllKarma: {
    type: Number, 
    optional: true,
    ...schemaDefaultValue(0),
    canRead: ['guests']
  },
  finalReviewVotesAllKarma: {
    type: Array,
    optional: true,
    ...schemaDefaultValue([]),
    canRead: ['guests']
  },
  'finalReviewVotesAllKarma.$': {
    type: Number,
    optional: true,
  },

  // DEPRECATED. Af Users didn't really vote in interesting enough ways to justify the UI complexity
  // of displaying these.
  finalReviewVoteScoreAF: {
    type: Number, 
    optional: true,
    ...schemaDefaultValue(0),
    canRead: ['guests']
  },
  finalReviewVotesAF: {
    type: Array,
    optional: true,
    ...schemaDefaultValue([]),
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
    canRead: ['guests'],
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
    },
    sqlResolver: ({field, resolverArg, join}) => join({
      table: "TagRels",
      type: "left",
      on: {
        postId: field("_id"),
        tagId: resolverArg("tagId"),
      },
      resolver: (tagRelField) => tagRelField("*"),
    }),
  }),

  tags: resolverOnlyField({
    type: "[Tag]",
    graphQLtype: "[Tag]",
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const { currentUser } = context;
      const tagRelevanceRecord: Record<string, number> = post.tagRelevance || {};
      const tagIds = Object.keys(tagRelevanceRecord).filter(id => tagRelevanceRecord[id] > 0);
      const tags = (await loadByIds(context, "Tags", tagIds)).filter(tag => !!tag) as DbTag[];

      const tagInfo = tags.map(tag => ({
        tag: tag,
        tagRel: { baseScore: tagRelevanceRecord[tag._id] } as TagRelMinimumFragment
      }));
      const sortedTagInfo = stableSortTags(tagInfo);

      const sortedTags = sortedTagInfo.map(({ tag }) => tag);

      return await accessFilterMultiple(currentUser, context.Tags, sortedTags, context);
    }
  }),
  
  // Denormalized, with manual callbacks. Mapping from tag ID to baseScore, ie
  // Record<string,number>. If submitted as part of a new-post submission, the
  // submitter applies/upvotes relevance for any tags included as keys.
  tagRelevance: {
    type: Object,
    optional: true,
    canCreate: ['members'],
    // This must be set to editable to allow the data to be sent from the edit form, but in practice it's always overwritten by updatePostDenormalizedTags
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canRead: ['guests'],
    
    blackbox: true,
    group: formGroups.tags,
    control: "FormComponentPostEditorTagging",
    hidden: ({eventForm, document}) => eventForm ||
      (isLWorAF && !!document?.collabEditorDialogue),
  },
  "tagRelevance.$": {
    type: Number,
    optional: true,
    hidden: true,
  },

  lastPromotedComment: resolverOnlyField({
    type: "Comment",
    graphQLtype: "Comment",
    canRead: ['guests'],
    resolver: async (post, args, context: ResolverContext) => {
      const { currentUser, Comments } = context;
      if (post.lastCommentPromotedAt) {
        const comment: DbComment|null = await getWithCustomLoader<DbComment|null,string>(context, "lastPromotedComments", post._id, async (postIds: string[]): Promise<Array<DbComment|null>> => {
          return await context.repos.comments.getPromotedCommentsOnPosts(postIds);
        });
        return await accessFilterSingle(currentUser, Comments, comment, context)
      }
    }
  }),

  bestAnswer: resolverOnlyField({
    type: "Comment",
    graphQLtype: "Comment",
    canRead: ['guests'],
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
  // in elastic. See PostsPage and HeadTags for their use of this field and the
  // noIndexLowKarma migration for the setting of it.
  noIndex: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },
  
  // TODO: doc
  rsvps: {
    type: Array,
    canRead: ['guests'],
    optional: true,
    // TODO: how to remove people without db access?
    hidden: true,
  },
  
  rsvpCounts: resolverOnlyField({
    type: "Object",
    graphQLtype: "JSON!",
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      return mapValues(groupBy(post.rsvps, rsvp=>rsvp.response), v=>v.length);
    }
  }),
  
  'rsvps.$': {
    type: rsvpType,
    canRead: ['guests'],
  },

  activateRSVPs: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    hidden: (props) => !props.eventForm,
    group: formGroups.event,
    control: 'checkbox',
    label: "Enable RSVPs for this event",
    tooltip: "RSVPs are public, but the associated email addresses are only visible to organizers.",
    optional: true
  },
  
  nextDayReminderSent: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: true,
    hidden: true,
    ...schemaDefaultValue(false),
  },
  
  onlyVisibleToLoggedIn: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    optional: true,
    group: formGroups.adminOptions,
    label: "Hide this post from users who are not logged in",
    ...schemaDefaultValue(false),
  },
  
  onlyVisibleToEstablishedAccounts: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    optional: true,
    group: formGroups.adminOptions,
    label: "Hide this post from logged out users and newly created accounts",
    ...schemaDefaultValue(false),
  },

  hideFromRecentDiscussions: {
    type: Boolean,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    control: 'checkbox',
    group: formGroups.adminOptions,
    label: 'Hide this post from recent discussions',
    ...schemaDefaultValue(false),
  },

  currentUserReviewVote: resolverOnlyField({
    type: "ReviewVote",
    graphQLtype: "ReviewVote",
    canRead: ['members'],
    resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<Partial<DbReviewVote>|null> => {
      if (!isLWorAF) {
        return null;
      }
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
    },
    sqlResolver: ({field, currentUserField, join}) => join({
      table: "ReviewVotes",
      type: "left",
      on: {
        postId: field("_id"),
        userId: currentUserField("_id"),
      },
      resolver: (reviewVotesField) => reviewVotesField("*"),
    }),
  }),

  reviewWinner: resolverOnlyField({
    type: "ReviewWinner",
    graphQLtype: "ReviewWinner",
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      if (!isLWorAF) {
        return null;
      }
      const { currentUser, ReviewWinners } = context;
      const winner = await getPostReviewWinnerInfo(post._id, context);
      return accessFilterSingle(currentUser, ReviewWinners, winner, context);
    },
  }),

  spotlight: resolverOnlyField({
    type: "Spotlight",
    graphQLtype: "Spotlight",
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const { currentUser, Spotlights } = context;
      const spotlight = await getWithLoader(context, Spotlights,
        "postSpotlight",
        {
          documentId: post._id,
          draft: false,
          deletedDraft: false
        },
        "documentId", post._id
      );
      return accessFilterSingle(currentUser, Spotlights, spotlight[0], context);
    },
    sqlResolver: ({field, join}) => join({
      table: "Spotlights",
      type: "left",
      on: {
        documentId: field("_id"),
        draft: "false",
        deletedDraft: "false"
      },
      resolver: (spotlightsField) => spotlightsField("*"),
    })
  }),

  votingSystem: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    group: formGroups.adminOptions,
    control: "select",
    form: {
      options: ({currentUser}: {currentUser: UsersCurrent}) => {
        const votingSystems = getVotingSystems()
        const filteredVotingSystems = currentUser.isAdmin ? votingSystems : votingSystems.filter(votingSystem => votingSystem.userCanActivate)
        return filteredVotingSystems.map(votingSystem => ({label: votingSystem.description, value: votingSystem.name}));
      }
    },

    // This can't use schemaDefaultValue because it varies by forum-type.
    // Trying to use schemaDefaultValue here with a branch by forum type broke
    // schema generation/migrations.
    defaultValue: "twoAxis",
    onCreate: ({document}) => document.votingSystem ?? getDefaultVotingSystem(),
    canAutofillDefault: true,
  },
  myEditorAccess: resolverOnlyField({
    type: String,
    graphQLtype: 'String!',
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<string> => {
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
      nullable: true,
      autoJoin: true,
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins', 'podcasters'],
    canUpdate: ['admins', 'podcasters'],
    control: 'PodcastEpisodeInput',
    group: formGroups.audio,
    nullable: true
  },
  // Forces allowing the type 3 audio player even if the post is not new or high karma enough. Note
  // this doesn't override every other condition (e.g. questions and events still can't have type 3 audio)
  forceAllowType3Audio: {
    type: Boolean,
    optional: true,
    nullable: false,
    hidden: false,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: "checkbox",
    order: 13,
    group: formGroups.adminOptions,
  },
  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
    type: Boolean,
    optional: true,
    nullable: false,
    hidden: false,
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: "checkbox",
    order: 12,
    group: formGroups.adminOptions,
  },

  // Legacy ID: ID used in the original LessWrong database
  legacyId: {
    type: String,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },

  // Legacy Spam: True if the original post in the legacy LW database had this post
  // marked as spam
  legacySpam: {
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    hidden: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
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
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    group: formGroups.adminOptions,
  },

  // Feed Link: If this post was automatically generated by an integrated RSS feed
  // then this field will have the link to the original blogpost it was posted from
  feedLink: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    group: formGroups.adminOptions
  },
 

  // lastVisitedAt: If the user is logged in and has viewed this post, the date
  // they last viewed it. Otherwise, null.
  lastVisitedAt: resolverOnlyField({
    type: Date,
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const lastReadStatus = await getLastReadStatus(post, context);
      return lastReadStatus?.lastUpdated;
    },
    sqlResolver: ({field, currentUserField, join}) => join({
      table: "ReadStatuses",
      type: "left",
      on: {
        postId: field("_id"),
        userId: currentUserField("_id"),
      },
      resolver: (readStatusField) => `${readStatusField("lastUpdated")}`,
    }),
  }),

  isRead: resolverOnlyField({
    type: Boolean,
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const lastReadStatus = await getLastReadStatus(post, context);
      return lastReadStatus?.isRead;
    },
    sqlResolver: ({field, currentUserField, join}) => join({
      table: "ReadStatuses",
      type: "left",
      on: {
        postId: field("_id"),
        userId: currentUserField("_id"),
      },
      resolver: (readStatusField) => `${readStatusField("isRead")} IS TRUE`,
    }),
  }),

  // curatedDate: Date at which the post was promoted to curated (null or false
  // if it never has been promoted to curated)
  curatedDate: {
    type: Date,
    control: 'datetime',
    optional: true,
    canRead: ['guests'],
    canUpdate: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
    canCreate: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
  },
  // metaDate: Date at which the post was marked as meta (null or false if it
  // never has been marked as meta)
  metaDate: {
    type: Date,
    control: 'datetime',
    optional: true,
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
  },
  suggestForCuratedUserIds: {
    // FIXME: client-side mutations of this are rewriting the whole thing,
    // when they should be doing add or delete. The current set up can cause
    // overwriting of other people's changes in a race.
    type: Array,
    canRead: ['members'],
    canCreate: ['sunshineRegiment', 'admins', 'canSuggestCuration'],
    canUpdate: ['sunshineRegiment', 'admins', 'canSuggestCuration'],
    optional: true,
    label: "Suggested for Curated by",
    control: "FormUserMultiselect",
    group: formGroups.adminOptions,
    resolveAs: {
      fieldName: 'suggestForCuratedUsernames',
      type: 'String',
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<string|null> => {
        // TODO - Turn this into a proper resolve field.
        // Ran into weird issue trying to get this to be a proper "users"
        // resolve field. Wasn't sure it actually needed to be anyway,
        // did a hacky thing.
        if (!post.suggestForCuratedUserIds) return null;
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
      sqlResolver: ({field}) => `(
        SELECT ARRAY_AGG(u."displayName")
        FROM UNNEST(${field("suggestForCuratedUserIds")}) AS "ids"
        JOIN "Users" u ON u."_id" = "ids"
      )`,
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
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
    ...(!requireReviewToFrontpagePostsSetting.get() && {
      onCreate: ({document: {isEvent, submitToFrontpage, draft}}) => eaFrontpageDateDefault(
        isEvent,
        submitToFrontpage,
        draft,
      ),
      onUpdate: ({data, oldDocument}) => {
        if (oldDocument.draft && data.draft === false && !oldDocument.frontpageDate) {
          return eaFrontpageDateDefault(
            data.isEvent ?? oldDocument.isEvent,
            data.submitToFrontpage ?? oldDocument.submitToFrontpage,
            false,
          );
        }
        // Setting frontpageDate to null is a special case that means "move to personal blog",
        // if frontpageDate is actually undefined then we want to use the old value.
        return data.frontpageDate === undefined ? oldDocument.frontpageDate : data.frontpageDate;
      },
    }),
  },

  autoFrontpage: {
    type: String,
    allowedValues: ["show", "hide"],
    canRead: ['sunshineRegiment', 'admins'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    hidden: true,
    optional: true,
    nullable: true,
  },

  collectionTitle: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
  },

  coauthorStatuses: {
    type: Array,
    resolveAs: {
      fieldName: 'coauthors',
      type: '[User!]',
      resolver: async (post: DbPost, args: void, context: ResolverContext) =>  {
        const resolvedDocs = await loadByIds(context, "Users",
          post.coauthorStatuses?.map(({ userId }) => userId) || []
        );
        return await accessFilterMultiple(context.currentUser, context['Users'], resolvedDocs, context);
      },
      addOriginalField: true,
    },
    canRead: [documentIsNotDeleted],
    canUpdate: ['sunshineRegiment', 'admins', userOverNKarmaOrApproved(MINIMUM_COAUTHOR_KARMA)],
    canCreate: ['sunshineRegiment', 'admins', userOverNKarmaOrApproved(MINIMUM_COAUTHOR_KARMA)],
    optional: true,
    nullable: true,
    label: "Co-Authors",
    control: "CoauthorsListEditor",
    group: formGroups.coauthors
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
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
    ...schemaDefaultValue(true),
  },

  // Cloudinary image id for an image that will be used as the OpenGraph image
  // DEPRECATED: use socialPreview.imageId instead
  socialPreviewImageId: {
    type: String,
    optional: true,
    hidden: true,
    label: "Social Preview Image",
    canRead: ['guests'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    group: formGroups.socialPreview,
    order: 4,
  },
  
  // Autoset OpenGraph image, derived from the first post image in a callback
  socialPreviewImageAutoUrl: {
    type: String,
    optional: true,
    hidden: true,
    label: "Social Preview Image Auto-generated URL",
    canRead: ['guests'],
    // TODO: should this be more restrictive?
    canUpdate: ['members'],
    canCreate: ['members'],
  },

  socialPreview: {
    type: new SimpleSchema({
      imageId: {
        type: String,
        optional: true,
        nullable: true
      },
      text: {
        type: String,
        optional: true,
        nullable: true
      },
    }),
    resolveAs: {
      type: "SocialPreviewType",
      fieldName: "socialPreviewData",
      addOriginalField: true,
      resolver: async (post: DbPost, args, context: ResolverContext) => {
        const { imageId, text } = post.socialPreview || {};
        const imageUrl = getSocialPreviewImage(post);
        return {
          _id: post._id,
          imageId,
          imageUrl,
          text,
        }
      }
    },
    optional: true,
    label: "Social Preview Image",
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    control: "SocialPreviewUpload",
    group: formGroups.socialPreview,
    order: 4,
    hidden: ({document}) => (isLWorAF && !!document?.collabEditorDialogue) || (isEAForum && !!document?.isEvent),
  },

  fmCrosspost: {
    type: new SimpleSchema({
      isCrosspost: Boolean,
      hostedHere: { type: Boolean, optional: true, nullable: true },
      foreignPostId: { type: String, optional: true, nullable: true },
    }),
    optional: true,
    canRead: [documentIsNotDeleted],
    canUpdate: [allOf(userOwns, userPassesCrosspostingKarmaThreshold), 'admins'],
    canCreate: [userPassesCrosspostingKarmaThreshold, 'admins'],
    control: "FMCrosspostControl",
    tooltip: fmCrosspostBaseUrlSetting.get()?.includes("forum.effectivealtruism.org") ?
      "The EA Forum is for discussions that are relevant to doing good effectively. If you're not sure what this means, consider exploring the Forum's Frontpage before posting on it." :
      undefined,
    group: formGroups.advancedOptions,
    order: 3,
    hidden: (props) => !fmCrosspostSiteNameSetting.get() || props.eventForm,
    ...schemaDefaultValueFmCrosspost,
    // Users aren't allowed to directly select the foreignPostId of a crosspost
    onCreate: (args) => {
      const { document, context } = args;
      // If we're handling a request from our peer site, then we have just set
      // the foreignPostId ourselves
      if (document.fmCrosspost?.foreignPostId && !context.isFMCrosspostRequest) {
        throw new Error("Cannot set the foreign post ID of a crosspost");
      }
      return schemaDefaultValueFmCrosspost.onCreate?.(args);
    },
    onUpdate: (args) => {
      const { data, oldDocument } = args;
      if (
        data.fmCrosspost?.foreignPostId &&
        data.fmCrosspost.foreignPostId !== oldDocument.fmCrosspost?.foreignPostId
      ) {
        throw new Error("Cannot change the foreign post ID of a crosspost");
      }
      return schemaDefaultValueFmCrosspost.onUpdate?.(args);
    },
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    hidden: false,
    control: "text",
    group: formGroups.canonicalSequence,
    resolveAs: {
      fieldName: 'canonicalCollection',
      addOriginalField: true,
      type: "Collection",
      // TODO: Make sure we run proper access checks on this. Using slugs means it doesn't
      // work out of the box with the id-resolver generators
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<Partial<DbCollection>|null> => {
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
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
    canRead: ['guests'],
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
    canRead: ['guests'],
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
    canRead: ['guests'],
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    label: "Include in default recommendations",
    control: "checkbox",
    order: 13,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  hideFromPopularComments: {
    type: Boolean,
    optional: true,
    canRead: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    label: "Hide comments on this post from Popular Comments",
    hidden: !isEAForum,
    control: "checkbox",
    order: 14,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  // Drafts
  draft: {
    label: 'Save to Drafts',
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    canRead: ['members'],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    hidden: true,
  },

  // If the post has ever been undrafted and published
  wasEverUndrafted: {
    type: Boolean,
    optional: true,
    nullable: false,
    ...schemaDefaultValue(false),
    canRead: ['members'],
    canCreate: ['members'],
    canUpdate: ['members'],
    hidden: true,
  },

  // meta: The post is published to the meta section of the page
  meta: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    hidden: true,
    label: "Publish to meta",
    control: "checkbox",
    ...schemaDefaultValue(false)
  },

  hideFrontpageComments: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: 'checkbox',
    group: formGroups.moderationGroup,
    ...schemaDefaultValue(false),
  },

  // maxBaseScore: Highest baseScore this post ever had, used for RSS feed generation
  maxBaseScore: {
    type: Number,
    optional: true,
    nullable: false,
    canRead: ['guests'],
    hidden: true,
    onCreate: ({document}) => document.baseScore ?? 0,
  },
  // The timestamp when the post's maxBaseScore first exceeded 2
  scoreExceeded2Date: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    onCreate: ({document}) => document.baseScore >= 2 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 30
  scoreExceeded30Date: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    onCreate: ({document}) => document.baseScore >= 30 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 45
  scoreExceeded45Date: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    onCreate: ({document}) => document.baseScore >= 45 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 75
  scoreExceeded75Date: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    onCreate: ({document}) => document.baseScore >= 75 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 125
  scoreExceeded125Date: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    onCreate: ({document}) => document.baseScore >= 125 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 200
  scoreExceeded200Date: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    onCreate: ({document}) => document.baseScore >= 200 ? new Date() : null
  },
  bannedUserIds: {
    type: Array,
    canRead: ['guests'],
    group: formGroups.moderationGroup,
    canCreate: [userCanModeratePost],
    canUpdate: ['sunshineRegiment', 'admins'],
    hidden: true,
    optional: true,
    // label: "Users banned from commenting on this post",
    // control: "FormUserMultiselect",
  },
  'bannedUserIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true
  },
  commentsLocked: {
    type: Boolean,
    canRead: ['guests'],
    group: formGroups.moderationGroup,
    canCreate: (currentUser: DbUser|null) => userCanCommentLock(currentUser, null),
    canUpdate: (currentUser: DbUser|null, document: DbPost) => userCanCommentLock(currentUser, document),
    optional: true,
    control: "checkbox",
  },
  commentsLockedToAccountsCreatedAfter: {
    type: Date,
    control: 'datetime',
    canRead: ['guests'],
    group: formGroups.moderationGroup,
    canCreate: (currentUser: DbUser|null) => userCanCommentLock(currentUser, null),
    canUpdate: (currentUser: DbUser|null, document: DbPost) => userCanCommentLock(currentUser, document),
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
    canRead: [documentIsNotDeleted],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: true,
    control: "FormUserMultiselect",
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
    canRead: [documentIsNotDeleted],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    optional: true,
    order: 1,
    control: 'SelectLocalgroup',
    label: 'Group',
    group: formGroups.event,
    hidden: (props) => !props.eventForm,
  },
  
  eventType: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    hidden: (props) => !props.eventForm || isLWorAF,
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['members'],
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
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },

  reviewForCuratedUserId: {
    type: String,
    foreignKey: "Users",
    optional: true,
    canRead: ['guests'],
    canUpdate: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
    canCreate: isEAForum ? ['admins'] : ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
    label: "Curated Review UserId"
  },

  startTime: {
    type: Date,
    hidden: (props) => !props.eventForm,
    canRead: ['guests'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'datetime',
    label: "Start Time",
    group: formGroups.event,
    optional: true,
    nullable: true,
    tooltip: 'For courses/programs, this is the application deadline.'
  },

  localStartTime: {
    type: Date,
    canRead: ['guests'],
  },

  endTime: {
    type: Date,
    hidden: (props) => !props.eventForm || props.document?.eventType === 'course',
    canRead: ['guests'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'datetime',
    label: "End Time",
    group: formGroups.event,
    optional: true,
    nullable: true,
  },

  localEndTime: {
    type: Date,
    canRead: ['guests'],
  },
  
  eventRegistrationLink: {
    type: String,
    hidden: (props) => !props.eventForm,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
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
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
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
    canRead: ['guests'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    optional: true,
    group: formGroups.event,
    order: 0,
    ...schemaDefaultValue(false),
  },
  
  globalEvent: {
    type: Boolean,
    hidden: (props) => !props.eventForm,
    canRead: ['guests'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    optional: true,
    group: formGroups.event,
    label: "This event is intended for a global audience",
    tooltip: 'By default, events are only advertised to people who are located nearby (for both in-person and online events). Check this to advertise it people located anywhere.',
    ...schemaDefaultValue(false),
  },

  mongoLocation: {
    type: Object,
    canRead: [documentIsNotDeleted],
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
    canRead: [documentIsNotDeleted],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    label: "Event Location",
    control: 'LocationFormComponent',
    blackbox: true,
    group: formGroups.event,
    optional: true
  },

  location: {
    type: String,
    canRead: [documentIsNotDeleted],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    hidden: true,
    optional: true
  },

  contactInfo: {
    type: String,
    hidden: (props) => !props.eventForm,
    canRead: [documentIsNotDeleted],
    canCreate: ['members'],
    canUpdate: ['members'],
    label: "Contact Info",
    control: "MuiTextField",
    optional: true,
    group: formGroups.event,
  },

  facebookLink: {
    type: String,
    hidden: (props) => !props.eventForm,
    canRead: [documentIsNotDeleted],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
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
    canRead: [documentIsNotDeleted],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
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
    canRead: [documentIsNotDeleted],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
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
    canRead: [documentIsNotDeleted],
    canCreate: ['members'],
    canUpdate: ['members'],
    control: "ImageUpload",
    group: formGroups.event,
    tooltip: "Recommend 1920x1005 px, 1.91:1 aspect ratio (same as Facebook)"
  },

  types: {
    type: Array,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    hidden: (props) => !isLWorAF || !props.eventForm,
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
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: 'checkbox',
    onCreate: ({document: post}) => {
      if(!post.metaSticky) {
        return false;
      }
    },
    onUpdate: ({modifier}) => {
      if (!modifier.$set.metaSticky) {
        return false;
      }
    }
  },

  sharingSettings: {
    type: Object,
    order: 15,
    canRead: ['guests'],
    canUpdate: [userOwns, 'admins'],
    canCreate: ['members'],
    optional: true,
    control: "PostSharingSettings",
    label: "Sharing Settings",
    group: formGroups.category,
    blackbox: true,
    hidden: (props) => !!props.debateForm
  },
  
  shareWithUsers: {
    order: 15,
    canRead: [documentIsNotDeleted],
    canCreate: ['members'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: true, 
    
    ...arrayOfForeignKeysField({
      idFieldName: "shareWithUsers",
      resolverName: "usersSharedWith",
      collectionName: "Users",
      type: "User"
    }),
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
    canRead: [userIsSharedOn, userOwns, 'admins'],
    canUpdate: ['admins'],
    optional: true,
    nullable: true,
    hidden: true,
  },

  // linkSharingKeyUsedBy: An array of user IDs who have used the link-sharing key
  // to unlock access.
  linkSharingKeyUsedBy: {
    type: Array,
    canRead: ['admins'],
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
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: true,
    group: formGroups.adminOptions,
  },

  // hideAuthor: Post stays online, but doesn't show on your user profile anymore, and doesn't
  // link back to your account
  hideAuthor: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: true,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  tableOfContents: {
    type: Object,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    // Implementation in postResolvers.ts
  },

  tableOfContentsRevision: {
    type: Object,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    // Implementation in postResolvers.ts
  },
  
  sideComments: {
    type: Object,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    // Implementation in postResolvers.ts
  },

  /**
   * Resolver to fetch the relevant data from the side comment caches table.
   * This data isn't directly viewable on the client, which instead uses the
   * data generated by the resolver for the `sideComments` field above. The
   * permissions here allow anybody to read this field (which is needed to
   * make this data accessible in the resolver) but the sqlPostProcess function
   * always sets the result to null to avoid sending large amounts of duplicated
   * data to the client (the data isn't sensitive though - just large).
   */
  sideCommentsCache: resolverOnlyField({
    type: "SideCommentCache",
    graphQLtype: "SideCommentCache",
    canRead: ["guests"],
    resolver: ({_id}: DbPost) => {
      if (!hasSideComments) {
        return null;
      }
      return SideCommentCaches.findOne({
        postId: _id,
        version: sideCommentCacheVersion,
      });
    },
    ...(hasSideComments && {
      sqlResolver: ({field, join}) => join({
        table: "SideCommentCaches",
        type: "left",
        on: {
          postId: field("_id"),
          version: `${sideCommentCacheVersion}`,
        },
        resolver: (sideCommentsField) => sideCommentsField("*"),
      }),
      sqlPostProcess: () => null,
    }),
  }),
  
  // This is basically deprecated. We now have them enabled by default
  // for all users. Leaving this field for legacy reasons.
  sideCommentVisibility: {
    type: String,
    optional: true,
    control: "select",
    group: formGroups.advancedOptions,
    hidden: true,
    
    label: "Replies in sidebar",
    canRead: ['guests'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
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
  
  /**
   * Author-controlled option to disable sidenotes (display of footnotes in the
   * right margin).
   */
  disableSidenotes: {
    type: Boolean,
    optional: true,
    group: formGroups.advancedOptions,
    canRead: ['guests'],
    // HACK: canCreate is more restrictive than canUpdate so that it's hidden on the new-post page, for clutter-reduction reasons, while leaving it still visible on the edit-post page
    canCreate: ['sunshineRegiment'],
    canUpdate: ['members'],
    hidden: !hasSidenotes,
    ...schemaDefaultValue(false),
  },

  moderationStyle: {
    type: String,
    optional: true,
    control: "select",
    group: formGroups.moderationGroup,
    label: "Style",
    canRead: ['guests'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    blackbox: true,
    order: 55,
    hidden: ({document}) => isFriendlyUI || !!document?.collabEditorDialogue,
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

  ignoreRateLimits: {
    type: Boolean,
    optional: true,
    nullable: true,
    hidden: ({document}) => isEAForum || !!document?.collabEditorDialogue,
    tooltip: "Allow rate-limited users to comment freely on this post",
    group: formGroups.moderationGroup,
    canRead: ["guests"],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    order: 60
  },
  
  // On a post, do not show comment karma
  hideCommentKarma: {
    type: Boolean,
    optional: true,
    group: formGroups.moderationGroup,
    canRead: ['guests'],
    canCreate: ['admins', postCanEditHideCommentKarma],
    canUpdate: ['admins', postCanEditHideCommentKarma],
    hidden: !isEAForum,
    denormalized: true,
    ...schemaDefaultValue(false),
  },

  commentCount: {
    type: Number,
    optional: true,
    ...denormalizedCountOfReferences({
      fieldName: "commentCount",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: comment => !comment.deleted && !comment.rejected && !comment.debateResponse && !comment.authorIsUnreviewed,
    }),
    canRead: ['guests'],
  },

  topLevelCommentCount: {
    type: Number,
    optional: true,
    ...denormalizedCountOfReferences({
      fieldName: "topLevelCommentCount",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: comment => !comment.deleted && !comment.parentCommentId
    }),
    canRead: ['guests'],
  },
  
  recentComments: resolverOnlyField({
    type: Array,
    graphQLtype: "[Comment]",
    canRead: ['guests'],
    graphqlArguments: 'commentsLimit: Int, maxAgeHours: Int, af: Boolean',
    // commentsLimit for some reason can receive a null (which was happening in one case)
    // we haven't figured out why yet
    resolver: async (post: DbPost, args: {commentsLimit?: number|null, maxAgeHours?: number, af?: boolean}, context: ResolverContext) => {
      const { commentsLimit, maxAgeHours=18, af=false } = args;
      const { currentUser, Comments } = context;
      const oneHourInMs = 60*60*1000;
      const lastCommentedOrNow = post.lastCommentedAt ?? new Date();
      const timeCutoff = new Date(lastCommentedOrNow.getTime() - (maxAgeHours*oneHourInMs));
      const loaderName = af?"recentCommentsAf" : "recentComments";
      const filter: MongoSelector<DbComment> = {
        ...getDefaultViewSelector("Comments"),
        score: {$gt:0},
        deletedPublic: false,
        postedAt: {$gt: timeCutoff},
        ...(af ? {af:true} : {}),
        ...(isLWorAF ? {userId: {$ne: reviewUserBotSetting.get()}} : {}),
      };
      const comments = await getWithCustomLoader<DbComment[],string>(context, loaderName, post._id, (postIds): Promise<DbComment[][]> => {
        return context.repos.comments.getRecentCommentsOnPosts(postIds, commentsLimit ?? 5, filter);
      });
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

  // This flag corresponds to the comments-in-the-post debate mode, not to be
  // confused with collab-editor debates.
  debate: {
    type: Boolean,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canCreate: ['debaters', 'sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    hidden: true,
    ...schemaDefaultValue(false)
  },
  
  // This flag corresponds to the collab-editor dialogue type, not to be confused
  // with comments-in-the-post style dialogues (which is the `debate`) flag.
  collabEditorDialogue: {
    type: Boolean,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    canUpdate: ['members', 'sunshineRegiment', 'admins'],
    hidden: true,
    ...schemaDefaultValue(false)
  },

  totalDialogueResponseCount: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    // Implementation in postResolvers.ts
  },

  mostRecentPublishedDialogueResponseDate: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    // Implementation in postResolvers.ts
  },

  unreadDebateResponseCount: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    // Implementation in postResolvers.ts
  },
  
  emojiReactors: resolverOnlyField({
    type: Object,
    graphQLtype: GraphQLJSON,
    blackbox: true,
    nullable: true,
    optional: true,
    hidden: true,
    canRead: ["guests"],
    resolver: async (post, _, context) => {
      const {extendedScore} = post;
      if (
        !isEAForum ||
        !extendedScore ||
        Object.keys(extendedScore).length < 1 ||
        "agreement" in extendedScore
      ) {
        return {};
      }
      const reactors = await context.repos.posts.getPostEmojiReactorsWithCache(post._id);
      return reactors ?? {};
    },
  }),

  commentEmojiReactors: resolverOnlyField({
    type: Object,
    graphQLtype: GraphQLJSON,
    blackbox: true,
    nullable: true,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    resolver: (post, _, context) => {
      if (post.votingSystem !== "eaEmojis") {
        return null;
      }
      return context.repos.posts.getCommentEmojiReactorsWithCache(post._id);
    },
  }),

  rejected: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    hidden: true,
    ...schemaDefaultValue(false),
  },

  rejectedReason: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },

  rejectedByUserId: {
    ...foreignKeyField({
      idFieldName: "rejectedByUserId",
      resolverName: "rejectedByUser",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
    onUpdate: ({modifier, document, currentUser}) => {
      if (modifier.$set?.rejected && currentUser) {
        return modifier.$set.rejectedByUserId || currentUser._id
      }
    },
  },

  dialogTooltipPreview: resolverOnlyField({
    type: String,
    nullable: true,
    canRead: ['guests'],
    resolver: async (post, _, context) => {
      if (!post.debate) return null;

      const { Comments } = context;

      const firstComment = await Comments.findOne({
        ...getDefaultViewSelector("Comments"),
        postId: post._id,
        // This actually forces `deleted: false` by combining with the default view selector
        deletedPublic: false,
        debateResponse: true,
      }, { sort: { postedAt: 1 } });

      if (!firstComment) return null;

      return firstComment.contents?.html;
    }
  }),

  dialogueMessageContents: {
    type: Object,
    canRead: ['guests'],
    hidden: true,
    optional: true
    //implementation in postResolvers.ts
  },
  
  firstVideoAttribsForPreview: {
    type: GraphQLJSON,
    canRead: ['guests'],
    hidden: true,
    optional: true
    //implementation in postResolvers.ts
  },

  /* subforum-related fields */

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

  /* Alignment Forum fields */

  af: {
    order:10,
    type: Boolean,
    optional: true,
    label: "Alignment Forum",
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: ['alignmentForum'],
    canCreate: ['alignmentForum'],
    control: 'checkbox',
    group: formGroups.advancedOptions,
  },

  afDate: {
    order:10,
    type: Date,
    optional: true,
    label: "Alignment Forum",
    hidden: true,
    canRead: ['guests'],
    canUpdate: ['alignmentForum'],
    canCreate: ['alignmentForum'],
    group: formGroups.advancedOptions,
  },

  afCommentCount: {
    ...denormalizedCountOfReferences({
      fieldName: "afCommentCount",
      collectionName: "Posts",
      foreignCollectionName: "Comments",
      foreignTypeName: "comment",
      foreignFieldName: "postId",
      filterFn: (comment: DbComment) => comment.af && !comment.deleted && !comment.debateResponse,
    }),
    label: "Alignment Comment Count",
    canRead: ['guests'],
  },

  afLastCommentedAt: {
    type: Date,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    onCreate: () => new Date(),
  },

  afSticky: {
    order: 10,
    type: Boolean,
    optional: true,
    label: "Sticky (Alignment)",
    ...schemaDefaultValue(false),
    group: formGroups.adminOptions,
    hidden: forumTypeSetting.get() === 'EAForum',
    canRead: ['guests'],
    canUpdate: ['alignmentForumAdmins', 'admins'],
    canCreate: ['alignmentForumAdmins', 'admins'],
    control: 'checkbox',
    onCreate: ({document: post}) => {
      if(!post.afSticky) {
        return false;
      }
    },
    onUpdate: ({modifier}) => {
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
    canRead: ['members'],
    canCreate: ['members', 'sunshineRegiment', 'admins'],
    canUpdate: ['members', 'alignmentForum', 'alignmentForumAdmins'],
    optional: true,
    hidden: true,
    label: "Suggested for Alignment by",
    control: "FormUserMultiselect",
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
    canRead: ['guests'],
    canUpdate: ['alignmentForumAdmins', 'admins'],
    canCreate: ['alignmentForumAdmins', 'admins'],
    group: formGroups.adminOptions,
    label: "AF Review UserId"
  },

  agentFoundationsId: {
    type: String,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: [userOwns, 'admins'],
  },

  /**
   * @deprecated Remove after 2024-06-14
   */
  swrCachingEnabled: {
    type: Boolean,
    optional: true,
    nullable: false,
    canRead: ['admins'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    label: "stale-while-revalidate caching enabled",
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },
  generateDraftJargon: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['members'],
    canUpdate: [userOwns, "admins"],
    ...schemaDefaultValue(false)
  },

  curationNotices: resolverOnlyField({
    type: Array,
    graphQLtype: '[CurationNotice]',
    canRead: ['guests'],
    resolver: async (post: DbPost, args: void, context: ResolverContext) => {
      const { currentUser, CurationNotices } = context;
      const curationNotices = await CurationNotices.find({
        postId: post._id,
        deleted: { $ne: true },
      }).fetch();
      return await accessFilterMultiple(currentUser, CurationNotices, curationNotices, context);
    }
  }),
  'curationNotices.$': {
    type: Object,
    foreignKey: 'CurationNotices',
  },
  // reviews that appear on SpotlightItem
  reviews: resolverOnlyField({
    type: Array,
    graphQLtype: "[Comment]",
    canRead: ['guests'],
    resolver: async (post: DbPost, args: {}, context: ResolverContext) => {
      const { currentUser, Comments } = context;
      const reviews = await context.Comments.find({postId: post._id, baseScore: {$gte: 10}, reviewingForReview: {$ne: null}}, {sort: {baseScore: -1}, limit: 2}).fetch();
      return await accessFilterMultiple(currentUser, Comments, reviews, context);
    }
  }),
  'reviews.$': {
    type: Object,
    foreignKey: 'Comments',
  },
};

export default schema;
