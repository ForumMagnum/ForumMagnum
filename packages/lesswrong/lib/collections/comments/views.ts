import moment from 'moment';
import { forumTypeSetting, isEAForum } from '../../instanceSettings';
import { hideUnreviewedAuthorCommentsSettings } from '../../publicSettings';
import { ReviewYear } from '../../reviewUtils';
import pick from 'lodash/pick';
import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';
import { viewFieldNullOrMissing } from '@/lib/utils/viewConstants';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { EA_FORUM_COMMUNITY_TOPIC_ID } from '../tags/helpers';

export const COMMENT_SORTING_MODES = new TupleSet([ 
  "top", "groupByPost", "new", "newest", "old", "oldest", "magic", "recentComments", "recentDiscussion"
] as const);

declare global {
  interface CommentsViewTerms extends ViewTermsBase {
    view?: CommentsViewName,
    postId?: string,
    userId?: string,
    drafts?: "exclude" | "include-my-draft-replies" | "include" | "drafts-only"
    tagId?: string,
    forumEventId?: string,
    relevantTagId?: string,
    maxAgeDays?: number,
    parentCommentId?: string,
    parentAnswerId?: string,
    topLevelCommentId?: string,
    legacyId?: string,
    authorIsUnreviewed?: boolean|null,
    sortBy?: CommentSortingMode,
    before?: Date|string|null,
    after?: Date|string|null,
    reviewYear?: ReviewYear
    profileTagIds?: string[],
    shortformFrontpage?: boolean,
    showCommunity?: boolean,
    commentIds?: string[],
    minimumKarma?: number,
  }
  
  /**
   * Comment sorting mode, a string which gets translated into a mongodb sort
   * order. Not every mode is shown in the UI in every context. Corresponds to
   * `sortings` (below).
   *
   * new/newest, old/oldest, and recentComments/recentDiscussion are synonyms.
   * In past versions, different subsets of these depending on whether you were
   * using an answers view, a subforum view, or something else.
   */
  type CommentSortingMode = UnionOf<typeof COMMENT_SORTING_MODES>;
}

// Spread into a view to remove the part of the default view selector that hides deleted and
// unreviewed comments.
const dontHideDeletedAndUnreviewed = {
  $or: null,
  $and: null,
  rejected: null
};


const sortings: Record<CommentSortingMode,MongoSelector<DbComment>> = {
  "top": { baseScore: -1 },
  "magic": { score: -1 },
  "groupByPost": { postId: 1 },
  "new": { postedAt: -1 },
  "newest": { postedAt: -1 },
  "old": { postedAt: 1 },
  "oldest": { postedAt: 1 },
  recentComments: { lastSubthreadActivity: -1 },
  /** DEPRECATED */
  recentDiscussion: { lastSubthreadActivity: -1 },
}

const getDraftSelector = ({ drafts = "include-my-draft-replies", context }: { drafts?: "exclude" | "include-my-draft-replies" | "include" | "drafts-only"; context?: ResolverContext; } = {}) => {
  const currentUserId = context?.currentUser?._id;

  switch (drafts) {
    case "include":
      return {};
    case "drafts-only":
      return { draft: true };
    case "include-my-draft-replies":
      return {
        $or: [
          { draft: false },
          {
            $and: [
              { draft: true },
              { parentCommentId: { $exists: true, $ne: null } },
              // Note: This is a hack to ensure mingo cache invalidation works:
              // 1. If we're on the server, context is defined, and selecting against the userId is
              //    required to not over-select drafts
              // 2. If we are in mingo, context will not be defined. In this case exclude userId from
              //    the cache key otherwise drafts won't trigger invalidation
              ...(context ? [{ userId: currentUserId ?? null }] : []),
            ]
          }
        ]
      };
    default:
      return { draft: false };
  }
};

function defaultView(terms: CommentsViewTerms, _: ApolloClient<NormalizedCacheObject>, context?: ResolverContext) {
  const validFields = pick(terms, 'userId', 'authorIsUnreviewed');

  const alignmentForum = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}
  const hideSince = hideUnreviewedAuthorCommentsSettings.get()
  
  const notDeletedOrDeletionIsPublic = {
    $or: [{$and: [{deleted: true}, {deletedPublic: true}]}, {deleted: false}],
  };
  
  // When we're hiding unreviewed comments, we allow comments that meet any of:
  //  * The author is reviewed
  //  * The comment was posted before the hideSince date
  //  * The comment was posted by the current user
  // Do not run this on the client (ie: Mingo), because we will not have the
  // resolver context, and return unreviewed comments to ensure cache is
  // properly invalidated.
  // We set `{$ne: true}` instead of `false` to allow for comments that haven't
  // had the default value set yet (ie: those created by the frontend
  // immediately prior to appearing)
  const shouldHideNewUnreviewedAuthorComments = (hideSince && bundleIsServer);
  const hideNewUnreviewedAuthorComments =
    (shouldHideNewUnreviewedAuthorComments && (
      {$or: [
        {authorIsUnreviewed: {$ne: true}},
        {postedAt: {$lt: new Date(hideSince)}},
        ...(context?.currentUser?._id ? [{userId: context?.currentUser?._id}] : [])
      ]}
    )
  );

  return ({
    selector: {
      $and: [
        ...(shouldHideNewUnreviewedAuthorComments ? [hideNewUnreviewedAuthorComments] : []),
        getDraftSelector({ drafts: terms.drafts, context }),
        notDeletedOrDeletionIsPublic
      ],
      hideAuthor: terms.userId ? false : undefined,
      ...(terms.commentIds && {_id: {$in: terms.commentIds}}),
      ...alignmentForum,
      ...validFields,
      debateResponse: { $ne: true },
      rejected: { $ne: true },
      ...(typeof terms.minimumKarma === 'number' ? {baseScore: {$gte: terms.minimumKarma}} : {}),
    },
    options: {
      sort: {postedAt: -1},
    }
  });
}

function commentReplies(terms: CommentsViewTerms) {
  return {
    selector: {
      parentCommentId: terms.parentCommentId,
    },
    options: {
      sort: {postedAt: -1}
    }
  }
}

function postCommentsDeleted(terms: CommentsViewTerms) {
  return {
    selector: {
      ...dontHideDeletedAndUnreviewed,
      deleted: null,
      postId: terms.postId
    },
    options: {sort: {deletedDate: -1, baseScore: -1, postedAt: -1}}
  };
}

function allCommentsDeleted(terms: CommentsViewTerms) {
  return {
    selector: {
      ...dontHideDeletedAndUnreviewed,
      deleted: true,
    },
    options: {sort: {deletedDate: -1, postedAt: -1, baseScore: -1 }}
  };
}

function checkedByModGPT(terms: CommentsViewTerms) {
  return {
    selector: {
      modGPTAnalysis: {$exists: true}
    },
    options: {sort: {postedAt: -1}}
  };
}

function postCommentsTop(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {draft: -1, promoted: -1, deleted: 1, baseScore: -1, postedAt: -1}},
  };
}

function postCommentsRecentReplies(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {draft: -1, lastSubthreadActivity: -1, promoted: -1, deleted: 1, baseScore: -1, postedAt: -1}},
  };
}

function postCommentsMagic(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {draft: -1, promoted: -1, deleted: 1, score: -1, postedAt: -1}},
  };
}

function afPostCommentsTop(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {draft: -1, promoted: -1, deleted: 1, afBaseScore: -1, postedAt: -1}},
  };
}

function postCommentsOld(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {draft: -1, deleted: 1, postedAt: 1}},
    parentAnswerId: viewFieldNullOrMissing
  };
}

function postCommentsNew(terms: CommentsViewTerms) {
  if (!terms.postId)
    throw new Error("Invalid postCommentsNew view: postId is required");
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {draft: -1, deleted: 1, postedAt: -1}}
  };
}

function postCommentsBest(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      parentAnswerId: viewFieldNullOrMissing,
      answer: false,
    },
    options: {sort: {draft: -1, promoted: -1, deleted: 1, baseScore: -1}, postedAt: -1}
  };
}

function postLWComments(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      af: null,
      answer: false,
      parentAnswerId: viewFieldNullOrMissing
    },
    options: {sort: {draft: -1, promoted: -1, deleted: 1, baseScore: -1, postedAt: -1}}
  };
}

export const profileCommentsSortings: Partial<Record<CommentSortingMode,MongoSelector<DbComment>>> = {
  "new" :  { isPinnedOnProfile: -1, postedAt: -1},
  "magic": { score: -1 },
  "top" : { baseScore: -1},
  "old": {postedAt: 1},
  "recentComments": { lastSubthreadActivity: -1 },
} as const;

// This view is DEPRECATED, use profileComments instead. This is here so that old links still work (plus greaterwrong etc)
function profileRecentComments(terms: CommentsViewTerms) {
  return {
    selector: {deletedPublic: false},
    options: {sort: {isPinnedOnProfile: -1, postedAt: -1}, limit: terms.limit || 5},
  };
}

function profileComments(terms: CommentsViewTerms) {
  const sortBy = terms.sortBy ?? "new"
  
  return {
    selector: {deletedPublic: false},
    options: {sort: profileCommentsSortings[sortBy], limit: terms.limit || 5},
  };
}

function draftComments(terms: CommentsViewTerms) {
  // If fetching comments for a specific post, show top level comments first
  // then replies. Otherwise sort by the most recent edit
  const sort = {  ...(terms.postId && { topLevelCommentId: 1 }), lastEditedAt: -1, postedAt: -1 }

  return {
    selector: {
      deletedPublic: false,
      postId: terms.postId
    },
    options: { sort, limit: terms.limit || 5 },
  };
}

function allRecentComments(terms: CommentsViewTerms) {
  return {
    selector: { deletedPublic: false },
    options: { 
      sort: terms.sortBy 
        ? sortings[terms.sortBy]
        : {postedAt: -1}, 
      limit: terms.limit || 5 
    },
  };
}

function recentComments(terms: CommentsViewTerms) {
  return {
    selector: { score:{$gt:0}, deletedPublic: false},
    options: {
      sort: terms.sortBy 
        ? sortings[terms.sortBy] 
        : { postedAt: -1 }, 
      limit: terms.limit || 5
    },
  };
}

function afSubmissions(terms: CommentsViewTerms) {
  return {
    selector: {
      af: false,
      suggestForAlignmentUserIds: terms.userId,
      deletedPublic: false},
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
}

function rejected(terms: CommentsViewTerms) {
  return {
    selector: {...dontHideDeletedAndUnreviewed, rejected: true},
    options: {sort: { postedAt: -1}, limit: terms.limit || 20},
  };
}

// As of 2021-10, JP is unsure if this is used
function recentDiscussionThread(terms: CommentsViewTerms) {
  // The forum has fewer comments, and so wants a more expansive definition of
  // "recent"
  const eighteenHoursAgo = moment().subtract(forumTypeSetting.get() === 'EAForum' ? 36 : 18, 'hours').toDate();
  return {
    selector: {
      postId: terms.postId,
      score: {$gt:0},
      deletedPublic: false,
      postedAt: {$gt: eighteenHoursAgo}
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5}
  };
}

function afRecentDiscussionThread(terms: CommentsViewTerms) {
  const sevenDaysAgo = moment().subtract(7, 'days').toDate();
  return {
    selector: {
      postId: terms.postId,
      score: {$gt:0}, 
      deletedPublic: false,
      postedAt: {$gt: sevenDaysAgo},
      af: true,
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5}
  };
}

function postsItemComments(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      deleted: false,
      postedAt: terms.after ? {$gt: new Date(terms.after)} : null,
      ...(!isEAForum && {score: {$gt: 0}}),
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 15},
  };
}

function sunshineNewCommentsList(terms: CommentsViewTerms) {
  return {
    selector: {
      ...dontHideDeletedAndUnreviewed,
      $or: [
        {needsReview: true},
        {baseScore: {$lte:0}}
      ],
      reviewedByUserId: {$exists:false},
      deleted: false,
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 5},
  };
}

export const questionAnswersSortings: Record<CommentSortingMode,MongoSelector<DbComment>> = {
  ...sortings,
  "top": {promoted: -1, baseScore: -1, postedAt: -1},
  "magic": {promoted: -1, score: -1, postedAt: -1},
} as const;

function questionAnswers(terms: CommentsViewTerms) {
  return {
    selector: {postId: terms.postId, answer: true},
    options: {sort: questionAnswersSortings[terms.sortBy || "top"]}
  };
}

// Used in legacy routes
function legacyIdComment(terms: CommentsViewTerms) {
  if (!terms.legacyId) throw new Error("Missing view argument: legacyId");
  const legacyId = parseInt(terms.legacyId, 36)
  if (isNaN(legacyId)) throw new Error("Invalid view argument: legacyId must be base36, was "+terms.legacyId);
  
  return {
    selector: {
      legacyId: ""+legacyId
    },
    options: {
      limit: 1
    }
  };
}

function sunshineNewUsersComments(terms: CommentsViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      // Don't hide deleted
      ...dontHideDeletedAndUnreviewed,
      // Don't hide unreviewed comments
      authorIsUnreviewed: null
    },
    options: {sort: {postedAt: -1}},
  };
}

function defaultModeratorResponses(terms: CommentsViewTerms) {
  return {
    selector: {
      tagId: terms.tagId,
    }
  };
}

function repliesToAnswer(terms: CommentsViewTerms) {
  return {
    selector: {parentAnswerId: terms.parentAnswerId},
    options: {sort: {baseScore: -1}}
  };
}

function answersAndReplies(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      $or: [
        { answer: true },
        { parentAnswerId: {$exists: true} },
      ],
    },
    options: {sort: questionAnswersSortings[terms.sortBy || "top"]}
  };
}

function topShortform(terms: CommentsViewTerms) {
  const timeRange = ((terms.before || terms.after)
    ? { postedAt: {
      ...(terms.before && {$lt: new Date(terms.before)}),
      ...(terms.after && {$gte: new Date(terms.after)})
    } }
    : null
  );

  const shortformFrontpage =
    isEAForum && typeof terms.shortformFrontpage === "boolean"
      ? {shortformFrontpage: terms.shortformFrontpage}
      : {};

  return {
    selector: {
      shortform: true,
      parentCommentId: viewFieldNullOrMissing,
      deleted: false,
      ...timeRange,
      ...shortformFrontpage,
    },
    options: {sort: {baseScore: -1, postedAt: -1}}
  };
}

function shortform(terms: CommentsViewTerms) {
  return {
    selector: {
      shortform: true,
      deleted: false,
      parentCommentId: viewFieldNullOrMissing,
    },
    options: {sort: {lastSubthreadActivity: -1, postedAt: -1}}
  };
}

function shortformFrontpage(terms: CommentsViewTerms, _: ApolloClient<NormalizedCacheObject>, context?: ResolverContext) {
  const twoHoursAgo = moment().subtract(2, 'hours').toDate();
  const maxAgeDays = terms.maxAgeDays ?? 5;
  const currentUserId = context?.currentUser?._id;
  return {
    selector: {
      shortform: true,
      shortformFrontpage: true,
      deleted: false,
      rejected: {$ne: true},
      parentCommentId: viewFieldNullOrMissing,
      createdAt: {$gt: moment().subtract(maxAgeDays, 'days').toDate()},
      $and: [
        !terms.showCommunity
          ? {
            relevantTagIds: {$ne: EA_FORUM_COMMUNITY_TOPIC_ID},
          }
          : {},
        !!terms.relevantTagId
          ? {
            relevantTagIds: terms.relevantTagId,
          }
          : {},
        {
          $or: [
            {authorIsUnreviewed: false},
            {userId: currentUserId},
          ]
        },
      ],
      // Quick takes older than 2 hours must have at least 1 karma, quick takes
      // younger than 2 hours must have at least -5 karma
      $or: [
        {
          baseScore: {$gte: 1},
          createdAt: {$lt: twoHoursAgo},
        },
        {
          baseScore: {$gte: -5},
          createdAt: {$gte: twoHoursAgo},
        },
      ],
    },
    options: {sort: {score: -1, lastSubthreadActivity: -1, postedAt: -1}}
  };
}

function repliesToCommentThread(terms: CommentsViewTerms) {
  return {
    selector: {
      topLevelCommentId: terms.topLevelCommentId
    },
    options: {sort: {baseScore: -1}}
  }
}

function repliesToCommentThreadIncludingRoot(terms: CommentsViewTerms) {
  return {
    selector: {
      $or: [
        {topLevelCommentId: terms.topLevelCommentId},
        {_id: terms.topLevelCommentId}
      ]
    },
    options: {sort: {baseScore: -1}}
  }
}

function shortformLatestChildren(terms: CommentsViewTerms) {
  return {
    selector: { topLevelCommentId: terms.topLevelCommentId} ,
    options: {sort: {postedAt: -1}, limit: 500}
  };
}

function nominations2018({userId, postId, sortBy="top"}: CommentsViewTerms) {
  return {
    selector: { 
      userId, 
      postId, 
      nominatedForReview: "2018",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
}

function nominations2019({userId, postId, sortBy="top"}: CommentsViewTerms) {
  return {
    selector: { 
      userId, 
      postId, 
      nominatedForReview: "2019",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
}

function reviews2018({userId, postId, sortBy="top"}: CommentsViewTerms) {
  return {
    selector: { 
      userId, 
      postId, 
      reviewingForReview: "2018",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
}

function reviews2019({userId, postId, sortBy="top"}: CommentsViewTerms) {
  return {
    selector: { 
      userId, 
      postId, 
      reviewingForReview: "2019",
      deleted: false
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
}

function reviews({userId, postId, reviewYear, sortBy="top", minimumKarma}: CommentsViewTerms) {
  const reviewingForReviewQuery = reviewYear ? reviewYear+"" : {$ne: null}
  const minimumKarmaQuery = minimumKarma ? {baseScore: {$gte: minimumKarma}} : {}
  return {
    selector: { 
      userId, 
      postId, 
      reviewingForReview: reviewingForReviewQuery,
      deleted: false,
      ...minimumKarmaQuery
    },
    options: {
      sort: { ...sortings[sortBy], postedAt: -1 }
    }
  };
}

// TODO merge with subforumFeedSortings
export const subforumSorting: Record<CommentSortingMode,MongoSelector<DbComment>> = {
  ...sortings,
}
export const subforumDiscussionDefaultSorting = "recentComments"

function tagDiscussionComments(terms: CommentsViewTerms) {
  return {
  selector: {
    tagId: terms.tagId,
    tagCommentType: "DISCUSSION"
  },
}};

function tagSubforumComments({tagId, sortBy=subforumDiscussionDefaultSorting}: CommentsViewTerms) {
  const sorting = subforumSorting[sortBy] || subforumSorting.new
  return {
  selector: {
    $or: [{tagId: tagId, tagCommentType: "SUBFORUM"}, {relevantTagIds: tagId}],
    topLevelCommentId: viewFieldNullOrMissing,
    deleted: false,
  },
  options: {
    sort: sorting,
  },
}};

// DEPRECATED (will be deleted once there are no more old clients floating around)
// For 'Discussion from your subforums' on the homepage
function latestSubforumDiscussion(terms: CommentsViewTerms) {
  return {
    selector: {
      tagId: {$in: terms.profileTagIds ?? []},
      tagCommentType: "SUBFORUM",
      topLevelCommentId: viewFieldNullOrMissing,
      lastSubthreadActivity: {$gt: moment().subtract(2, 'days').toDate()}
    },
    options: {
      sort: subforumSorting.recentComments,
      limit: 3,
    },
  }
}

function moderatorComments(terms: CommentsViewTerms) {
  return {
  selector: {
    moderatorHat: true,
  },
  options: {
    sort: {postedAt: -1},
  },
}};

function debateResponses(terms: CommentsViewTerms) {
  return {
  selector: {
    postId: terms.postId,
    debateResponse: true
  },
  options: {
    sort: { 
      postedAt: 1
     }
  }
}};

function recentDebateResponses(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      debateResponse: true,
      deleted: false,
    },
    options: {sort: {postedAt: -1}, limit: terms.limit || 7},
  };
}

function forumEventComments(terms: CommentsViewTerms) {
  return {
    selector: {
      forumEventId: terms.forumEventId,
      ...(terms.userId && { userId: terms.userId }),
      deleted: false,
    },
    options: {
      sort: { postedAt: -1 },
    },
  };
}

function alignmentSuggestedComments(terms: CommentsViewTerms) {
  return {
    selector: {
      postId: terms.postId,
      af: false,
      suggestForAlignmentUserIds: {$exists:true, $ne: []},
      reviewForAlignmentUserId: viewFieldNullOrMissing
    },
    options: {
      sort: {
        postedAt: 1,
      }, 
      hint: "comments.alignmentSuggestedComments",
    }
  }
}


// Create the CollectionViewSet instance
export const CommentsViews = new CollectionViewSet('Comments', {
  commentReplies,
  postCommentsDeleted,
  allCommentsDeleted,
  checkedByModGPT,
  postCommentsTop,
  postCommentsRecentReplies,
  postCommentsMagic,
  afPostCommentsTop,
  postCommentsOld,
  postCommentsNew,
  postCommentsBest,
  postLWComments,
  profileRecentComments,
  profileComments,
  draftComments,
  allRecentComments,
  recentComments,
  afSubmissions,
  rejected,
  recentDiscussionThread,
  afRecentDiscussionThread,
  postsItemComments,
  sunshineNewCommentsList,
  questionAnswers,
  legacyIdComment,
  sunshineNewUsersComments,
  defaultModeratorResponses,
  repliesToAnswer,
  answersAndReplies,
  topShortform,
  shortform,
  shortformFrontpage,
  repliesToCommentThread,
  repliesToCommentThreadIncludingRoot,
  shortformLatestChildren,
  nominations2018,
  nominations2019,
  reviews2018,
  reviews2019,
  reviews,
  tagDiscussionComments,
  tagSubforumComments,
  latestSubforumDiscussion,
  moderatorComments,
  debateResponses,
  recentDebateResponses,
  forumEventComments,
  alignmentSuggestedComments,
  // Copied over from server/rss.ts
  rss: recentComments,
}, defaultView);
