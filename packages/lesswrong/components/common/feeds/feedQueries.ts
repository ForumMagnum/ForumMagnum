import { gql } from "@/lib/generated/gql-codegen";
import { ResultOf } from "@graphql-typed-document-node/core";

export const AllTagsActivityFeedQuery = gql(`
  query AllTagsActivityFeed($limit: Int, $cutoff: Date, $offset: Int) {
    AllTagsActivityFeed(limit: $limit, cutoff: $cutoff, offset: $offset) {
      __typename
      cutoff
      endOffset
      results {
        type
        tagCreated {
          ...TagCreationHistoryFragment
        }
        tagRevision {
          ...RevisionTagFragment
        }
        tagDiscussionComment {
          ...CommentsListWithParentMetadata
        }
      }
    }
  }
`);

export const TagHistoryFeedQuery = gql(`
  query TagHistoryFeed($limit: Int, $cutoff: Date, $offset: Int, $tagId: String!, $options: JSON) {
    TagHistoryFeed(limit: $limit, cutoff: $cutoff, offset: $offset, tagId: $tagId, options: $options) {
      __typename
      cutoff
      endOffset
      results {
        type
        tagCreated {
          ...TagHistoryFragment
        }
        tagRevision {
          ...RevisionHistoryEntry
        }
        lensRevision {
          ...RevisionHistoryEntry
        }
        summaryRevision {
          ...RevisionHistorySummaryEdit
        }
        tagApplied {
          ...TagRelHistoryFragment
        }
        tagDiscussionComment {
          ...CommentsList
        }
        wikiMetadataChanged {
          ...FieldChangeFragment
        }
        lensOrSummaryMetadataChanged {
          ...FieldChangeFragment
        }
      }
    }
  }
`);

export const RecentDiscussionFeedQuery = gql(`
  query RecentDiscussionFeed($limit: Int, $cutoff: Date, $offset: Int, $af: Boolean, $commentsLimit: Int, $maxAgeHours: Int, $tagCommentsLimit: Int) {
    RecentDiscussionFeed(limit: $limit, cutoff: $cutoff, offset: $offset, af: $af) {
      __typename
      cutoff
      endOffset
      results {
        type
        postCommented {
          ...PostsRecentDiscussion
        }
        shortformCommented {
          ...ShortformRecentDiscussion
        }
        tagDiscussed {
          ...TagRecentDiscussion
        }
        tagRevised {
          ...RecentDiscussionRevisionTagFragment
        }
      }
    }
  }
`);

export const SubscribedFeedQuery = gql(`
  query SubscribedFeed($limit: Int, $cutoff: Date, $offset: Int, $af: Boolean) {
    SubscribedFeed(limit: $limit, cutoff: $cutoff, offset: $offset, af: $af) {
      __typename
      cutoff
      endOffset
      results {
        type
        postCommented {
          ...SubscribedPostAndCommentsFeed
        }
      }
    }
  }
`);

const SubforumMagicFeedQuery = gql(`
  query SubforumMagicFeed($tagId: String!, $limit: Int, $cutoff: Float, $offset: Int, $af: Boolean, $commentsLimit: Int, $maxAgeHours: Int) {
    SubforumMagicFeed(tagId: $tagId, limit: $limit, cutoff: $cutoff, offset: $offset, af: $af) {
      __typename
      cutoff
      endOffset
      results {
        type
        tagSubforumPosts {
          ...PostsRecentDiscussion
        }
        tagSubforumComments {
          ...CommentWithRepliesFragment
        }
        tagSubforumStickyComments {
          ...StickySubforumCommentFragment
        }
      }
    }
  }
`);

const SubforumNewFeedQuery = gql(`
  query SubforumNewFeed($tagId: String!, $limit: Int, $cutoff: Date, $offset: Int, $af: Boolean, $commentsLimit: Int, $maxAgeHours: Int) {
    SubforumNewFeed(tagId: $tagId, limit: $limit, cutoff: $cutoff, offset: $offset, af: $af) {
      __typename
      cutoff
      endOffset
      results {
        type
        tagSubforumPosts {
          ...PostsRecentDiscussion
        }
        tagSubforumComments {
          ...CommentWithRepliesFragment
        }
        tagSubforumStickyComments {
          ...StickySubforumCommentFragment
        }
      }
    }
  }
`);

const SubforumOldFeedQuery = gql(`
  query SubforumOldFeed($tagId: String!, $limit: Int, $cutoff: Date, $offset: Int, $af: Boolean, $commentsLimit: Int, $maxAgeHours: Int) {
    SubforumOldFeed(tagId: $tagId, limit: $limit, cutoff: $cutoff, offset: $offset, af: $af) {
      __typename
      cutoff
      endOffset
      results {
        type
        tagSubforumPosts {
          ...PostsRecentDiscussion
        }
        tagSubforumComments {
          ...CommentWithRepliesFragment
        }
        tagSubforumStickyComments {
          ...StickySubforumCommentFragment
        }
      }
    }
  }
`);

const SubforumRecentCommentsFeedQuery = gql(`
  query SubforumRecentCommentsFeed($tagId: String!, $limit: Int, $cutoff: Date, $offset: Int, $af: Boolean, $commentsLimit: Int, $maxAgeHours: Int) {
    SubforumRecentCommentsFeed(tagId: $tagId, limit: $limit, cutoff: $cutoff, offset: $offset, af: $af) {
      __typename
      cutoff
      endOffset
      results {
        type
        tagSubforumPosts {
          ...PostsRecentDiscussion
        }
        tagSubforumComments {
          ...CommentWithRepliesFragment
        }
        tagSubforumStickyComments {
          ...StickySubforumCommentFragment
        }
      }
    }
  }
`);

const SubforumTopFeedQuery = gql(`
  query SubforumTopFeed($tagId: String!, $limit: Int, $cutoff: Int, $offset: Int, $af: Boolean, $commentsLimit: Int, $maxAgeHours: Int) {
    SubforumTopFeed(tagId: $tagId, limit: $limit, cutoff: $cutoff, offset: $offset, af: $af) {
      __typename
      cutoff
      endOffset
      results {
        type
        tagSubforumPosts {
          ...PostsRecentDiscussion
        }
        tagSubforumComments {
          ...CommentWithRepliesFragment
        }
        tagSubforumStickyComments {
          ...StickySubforumCommentFragment
        }
      }
    }
  }
`);

export const SubforumFeedQueries = {
  SubforumMagicFeed: SubforumMagicFeedQuery,
  SubforumNewFeed: SubforumNewFeedQuery,
  SubforumOldFeed: SubforumOldFeedQuery,
  SubforumRecentCommentsFeed: SubforumRecentCommentsFeedQuery,
  SubforumTopFeed: SubforumTopFeedQuery,
};

export const UltraFeedQuery = gql(`
  query UltraFeed($limit: Int, $cutoff: Date, $offset: Int, $sessionId: String, $settings: JSON) {
    UltraFeed(limit: $limit, cutoff: $cutoff, offset: $offset, sessionId: $sessionId, settings: $settings) {
      __typename
      cutoff
      endOffset
      results {
        type
        feedCommentThread {
          ...FeedCommentThreadFragment
        }
        feedPost {
          ...FeedPostFragment
        }
        feedSpotlight {
          ...FeedSpotlightFragment
        }
        feedSubscriptionSuggestions {
          ...FeedSubscriptionSuggestionsFragment
        }
      }
    }
  }
`);

export const UltraFeedHistoryQuery = gql(`
  query UltraFeedHistory($limit: Int, $cutoff: Date, $offset: Int) {
    UltraFeedHistory(limit: $limit, cutoff: $cutoff, offset: $offset) {
      __typename
      cutoff
      endOffset
      results {
        type
        feedCommentThread {
          ...FeedCommentThreadFragment
        }
        feedPost {
          ...FeedPostFragment
        }
        feedSpotlight {
          ...FeedSpotlightFragment
        }
      }
    }
  }
`);

export const UltraFeedSubscriptionsQuery = gql(`
  query UltraFeedSubscriptions($limit: Int, $cutoff: Date, $offset: Int, $settings: JSON) {
    UltraFeedSubscriptions(limit: $limit, cutoff: $cutoff, offset: $offset, settings: $settings) {
      __typename
      cutoff
      endOffset
      results {
        type
        feedCommentThread {
          ...FeedCommentThreadFragment
        }
        feedPost {
          ...FeedPostFragment
        }
        feedSubscriptionSuggestions {
          ...FeedSubscriptionSuggestionsFragment
        }
      }
    }
  }
`);

export type FeedQuery = 
  | typeof AllTagsActivityFeedQuery
  | typeof TagHistoryFeedQuery
  | typeof RecentDiscussionFeedQuery
  | typeof SubscribedFeedQuery
  | typeof SubforumMagicFeedQuery
  | typeof SubforumNewFeedQuery
  | typeof SubforumOldFeedQuery
  | typeof SubforumRecentCommentsFeedQuery
  | typeof SubforumTopFeedQuery
  | typeof UltraFeedQuery
  | typeof UltraFeedHistoryQuery
  | typeof UltraFeedSubscriptionsQuery;

export interface FeedPaginationResultVariables {
  cutoff?: number | null,
  endOffset?: number | null,
  limit?: number | null,
  results?: any[] | null,
}

// Helper types to extract the structure of feed results
type ExtractFeedResult<T> = T extends Record<string, infer R> 
  ? R extends { results?: Array<infer Item> | null }
    ? Item
    : never
  : never;

type ExtractFeedFields<T> = T extends { type: infer FeedResultFields extends string }
  ? string extends FeedResultFields ? never : T['type']
  : never;

// Get the fragment type for a specific field in the result, if it exists as a field
// In some cases, like in RecentDiscussionFeed, we have entries that don't have "values",
// like "meetupsPoke" or "subscribeReminder".  In those cases, return undefined to
// enforce that the field renderer's render function doesn't accept any arguments.
type ExtractFieldType<TResult, TField extends string> = TResult extends Record<TField, infer V>
  ? V extends null | undefined ? never : V
  : undefined;

// Extract valid renderer keys and their corresponding fragment types from a query
export type ExtractRenderers<TQuery extends FeedQuery> = ExtractFeedFields<ExtractFeedResult<ResultOf<TQuery>>> extends never ? never : {
  [K in ExtractFeedFields<ExtractFeedResult<ResultOf<TQuery>>>]?: ExtractFieldType<ExtractFeedResult<ResultOf<TQuery>>, K> extends infer FieldType
    ? FieldType extends never | undefined
      ? { render: () => React.ReactNode }
      : { render: (result: FieldType, index?: number) => React.ReactNode }
    : { render: () => React.ReactNode }
};
