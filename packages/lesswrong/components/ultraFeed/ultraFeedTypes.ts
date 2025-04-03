export type FeedItemSourceType = 'postThreads' | 'commentThreads' | 'spotlights' | 'quickTakes' | 'topComments' | 'RecombeeHybridPosts';

export const feedItemRenderTypes = ["feedCommentThread", "feedPost", "feedSpotlight"] as const;
export type FeedItemRenderType = typeof feedItemRenderTypes[number];
 

export interface RecombeeMetaInfo {
  scenario: string;
  recommId: string;
  generatedAt: Date;
}

export interface FeedPostMetaInfo {
  recommInfo?: RecombeeMetaInfo;
  sources: FeedItemSourceType[];
  displayStatus: FeedItemDisplayStatus;
}
export interface FeedCommentMetaInfo {
  /** Sources where this comment came from */
  sources: FeedItemSourceType[] | null;
  /** Number of siblings (comments with the same parent) */
  siblingCount: number | null;
  /** When this comment was last included in a feed serving */
  lastServed: Date | null;
  /** When this comment was last marked as 'viewed' */
  lastViewed: Date | null;
  /** When this comment was last interacted with (currently 'expanded') */
  lastInteracted: Date | null;
  /** When the comment was originally posted */
  postedAt: Date | null;
  /** Display status (expanded/collapsed/hidden) - may be determined by timestamps later */
  displayStatus?: FeedItemDisplayStatus;
  /** Whether this comment should be highlighted with a green vertical line */
  highlight?: boolean;
}

export interface FeedCommentFromDb {
  commentId: string;
  topLevelCommentId: string;
  parentCommentId: string;
  postId: string;
  baseScore: number;
  sources: string[];
  lastServed: Date | null;
  lastViewed: Date | null;
  lastInteracted: Date | null;
  postedAt: Date | null;
}

/**
 * A comment that's a candidate for inclusion in the feed.
 * Used in: UltraFeedRepo.getAllCommentThreads(), buildDistinctLinearThreads()
 */
export interface PreDisplayFeedComment {
  commentId: string;
  postId: string;
  baseScore: number;
  topLevelCommentId?: string | null;
  metaInfo: FeedCommentMetaInfo | null;
}

/**
 * A list PreDisplayFeedComments, i.e. one linear thread
 */
export type PreDisplayFeedCommentThread = PreDisplayFeedComment[];


/**
 * Lightweight feed post/comment thread with ID and metadata, without full content.
 * Used when retrieving data from repos for the feed.
 */
export interface FeedPostWithComments {
  postId?: string;
  commentIds?: string[];
  commentMetaInfos?: {[commentId: string]: FeedCommentMetaInfo};
  postMetaInfo: FeedPostMetaInfo;
}

export interface FeedSpotlight {
  spotlightId: string;
}

export interface FeedSpotlightItem {
  _id: string;
  spotlight: DbSpotlight;
}

export type FeedItem = FeedPostWithComments | FeedSpotlight;

export interface FeedPostWithCommentsResolverType {
  _id: string;
  post: DbPost;
  postMetaInfo: FeedPostMetaInfo;
  comments: DbComment[];
  commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo};
}

export interface FeedSpotlightResolverType {
  _id: string;
  spotlight: DbSpotlight;
}

export type FeedItemResolverType = FeedPostWithCommentsResolverType | FeedSpotlightResolverType;

export interface UltraFeedResolverType {
  type: FeedItemRenderType;
  feedPost?: FeedPostWithCommentsResolverType;
  feedCommentThread?: FeedPostWithCommentsResolverType;
  feedSpotlight?: FeedSpotlightResolverType;
}

export interface DisplayFeedPostWithComments {
  _id: string;
  postMetaInfo: FeedPostMetaInfo;
  commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo};
  post: PostsListWithVotes;
  comments: CommentsList[];
}

/**
 * Statistics about a thread, used for prioritization.
 * Used in: UltraFeedRepo.getThreadStatistics(), prioritizeThreads()
 */
export interface LinearCommentThreadStatistics {
  commentCount: number;
  maxKarma: number;
  sumKarma: number;
  sumKarmaSquared: number;
  averageKarma: number;
  averageTop3Comments: number;
}

//-----------------------------------------------------------------------------
// 3. DISPLAY TYPES - For Client/GraphQL
//-----------------------------------------------------------------------------

// export type UltraFeedTopLevelTypes = DisplayFeedPostWithComments | DisplayFeedSpotlight;
// export interface DisplayFeedItem {
//   item: UltraFeedTopLevelTypes;
//   type: string;
//   renderAsType: FeedItemRenderType;
//   sources: FeedItemSourceType[] | null;
// }

// /**
//  * Data structure for displaying a comment in the feed.
//  * Used in: UltraFeed component
//  */
export interface DisplayFeedComment {
  comment: CommentsList;
  metaInfo: Pick<FeedCommentMetaInfo, 'sources' | 'displayStatus'>;
}


/**
 * Converts DbComment[] to CommentsList[]
 * This is needed because FeedPostCommentsCard expects CommentsList[].
 * Used in: UltraFeed component
 * 
 * @param feedItem A PostFeedItem validated with isPostFeedItem
 * @returns The comments cast to the expected type for FeedPostCommentsCard
 */
// export function getCommentsForFeed(feedItem: PostFeedItem): CommentsList[] {
//   // The comments from the feed have the necessary fields
//   // Just need to cast to the right type for TypeScript
//   return (feedItem.secondaryComments || []) as unknown as CommentsList[];
// }


//-----------------------------------------------------------------------------
// 4. STORAGE TYPES - For FeedItemServings
//-----------------------------------------------------------------------------

/**
 * DB-oriented representation with only IDs.
 * Used in: feedItemUtils.ts (dehydrateFeedItem)
 */
export type DehydratedFeedItem = {
  _id: string;
  renderAsType: FeedItemRenderType;
  sources: string[];
  primaryDocumentId: string | null;
  primaryDocumentCollectionName: string | null;
  secondaryDocumentIds: string[] | null;
  secondaryDocumentsCollectionName: string | null;
  originalServingId: string | null;
  mostRecentServingId: string | null;
};

//-----------------------------------------------------------------------------
// 5. NEW ITEM CONTENT TYPES - For FeedItemServings.itemContent
//-----------------------------------------------------------------------------

/**
 * Display status for feed items.
 * Used in: itemContent field types
 */
export type FeedItemDisplayStatus = "expanded" | "collapsed" | "hidden";

/**
 * Base interface for all item content types.
 * Used in: itemContent field in FeedItemServings
 */
export interface BaseFeedItemContent {
  type: string; // Discriminator field to determine the concrete type
}

/**
 * Simple display item for comments in a thread.
 * Used in: itemContent field types
 */
export interface FeedCommentDisplayItem {
  commentId: string;
  status: FeedItemDisplayStatus;
}

/**
 * Comment thread item type.
 * Used in: itemContent field in FeedItemServings
 */
export interface CommentThreadFeedItemContent extends BaseFeedItemContent {
  type: "commentThread";
  comments: FeedCommentDisplayItem[];
  topLevelCommentId: string;
}

/**
 * Post item type.
 * Used in: itemContent field in FeedItemServings
 */
export interface PostFeedItemContent extends BaseFeedItemContent {
  type: "post";
  postId: string;
  status: Omit<FeedItemDisplayStatus, 'hidden'>;
  comments: FeedCommentDisplayItem[];
}

