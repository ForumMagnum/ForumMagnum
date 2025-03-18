/**
 * UltraFeed Type Definitions
 * 
 * This file contains all the type definitions for the UltraFeed system,
 * organized by where they appear in the data pipeline:
 * 
 * 1. RAW DATA: Types for raw data from the database
 * 2. PROCESSING: Types used during thread construction and enrichment
 * 3. DISPLAY: Types used when sending data to the client
 * 4. STORAGE: Types used when storing data in FeedItemServings
 * 5. REHYDRATION: Types used when retrieving stored items for display
 */


//-----------------------------------------------------------------------------
// 2. PROCESSING & ENRICHMENT TYPES
//-----------------------------------------------------------------------------

/**
 * The type of source where a comment came from.
 * Used in: Various feed item candidates and display types
 */
export type FeedItemSourceType = 'QuickTake' | 'PopularComment' | string;

/**
 * Metadata for feed comments, including sources and sibling information.
 * Used in: FeedCommentCandidate
 */
export interface FeedCommentMetaInfo {
  /** Sources where this comment came from */
  sources: FeedItemSourceType[] | null;
  /** Number of siblings (comments with the same parent) */
  siblingCount: number;
  /** Whether the user has seen this comment before */
  alreadySeen: boolean | null;
  /** Display status (expanded/collapsed/hidden) */
  displayStatus?: FeedItemDisplayStatus;
}

/**
 * A comment that's a candidate for inclusion in the feed.
 * Used in: UltraFeedRepo.getAllCommentThreads(), buildDistinctLinearThreads()
 */
export interface PreDisplayFeedComment {
  /** The comment itself with all its data */
  comment: CommentsList;
  /** Metadata about the comment's context in the feed */
  metaInfo: Pick<FeedCommentMetaInfo, 'sources'>;
}



/**
 * A linear thread of comments for display in the feed.
 * Used in: UltraFeedRepo.getAllCommentThreads(), prioritizeThreads()
 */
export interface PreDisplayFeedCommentThread {
  /** Post the comments belong to */
  post: PostsMinimumInfo; 
  /** List of comments in the thread */
  comments: PreDisplayFeedComment[]; 
  /** ID of the root comment in the thread */
  topLevelCommentId: string; 
  /** ID for tracking analytics */
}

/**
 * Same as FeedCommentThread but without analytics ID.
 * Used in: UltraFeedRepo functions before assigning a servingId
 */
// export type FeedCommentThreadWithoutServingId = Omit<PreDisplayFeedCommentThread, 'servingId'>;

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

export interface DisplayFeedItem {
  _id: string;
  item: FeedItemContent;
  renderAsType: FeedItemRenderType;
  sources: FeedItemSourceType[] | null;
}

/**
 * Data structure for displaying a comment in the feed.
 * Used in: UltraFeed component
 */
export interface DisplayFeedComment {
  comment: CommentsList;
  metaInfo: Pick<FeedCommentMetaInfo, 'sources' | 'displayStatus'>;
}

export interface DisplayFeedCommentThread {
  post: PostsMinimumInfo; // TODO: maybe want fragment with post contents?
  comments: DisplayFeedComment[];
  topLevelCommentId: string;
}


/** 
 * The valid render types for feed items.
 * Used in: Various feed item related types and functions
 */
export type FeedItemRenderType = "feedComment" | "feedPost" | "feedCommentThread";


/**
 * Feed item containing a comment (final hydrated version).
 * Used in: feedItemUtils.ts, ultraFeedResolver.ts
 */
export interface FeedCommentItem {
  _id: string;
  type: string;
  renderAsType: "feedComment";
  primaryComment: DbComment;
  secondaryComments: DbComment[];
  primaryPost: DbPost | null;
  secondaryPosts: DbPost[];
  sources: string[];
  originalServingId: string | null;
  mostRecentServingId: string | null;
}

/**
 * Feed item containing a post (final hydrated version).
 * Used in: feedItemUtils.ts, ultraFeedResolver.ts
 */
export interface FeedPostItem {
  _id: string;
  type: string;
  renderAsType: "feedPost";
  primaryPost: DbPost;
  secondaryPosts: DbPost[];
  primaryComment: DbComment | null;
  secondaryComments: DbComment[];
  sources: string[];
  originalServingId: string | null;
  mostRecentServingId: string | null;
}

/**
 * Union type for all final hydrated feed items.
 * Used in: feedItemUtils.ts, ultraFeedResolver.ts
 */
export type HydratedFeedItem = FeedCommentItem | FeedPostItem;

/**
 * Type for feed items containing a comment (client-side version).
 * Used in: UltraFeed component
 */
export interface CommentFeedItem {
  _id: string;
  type: string;
  renderAsType: 'feedComment';
  sources: string[] | null;
  primaryComment: DbComment & { post?: PostsMinimumInfo | null };
  primaryPost: null;
  secondaryComments: DbComment[] | null;
  secondaryPosts: DbPost[] | null;
  __typename?: string;
}

/**
 * Type for feed items containing a post (client-side version).
 * Used in: UltraFeed component
 */
export interface PostFeedItem {
  _id: string;
  type: string;
  renderAsType: 'feedPost';
  sources: string[] | null;
  primaryComment: null;
  primaryPost: DbPost;
  secondaryComments: DbComment[] | null;
  secondaryPosts: DbPost[] | null;
  __typename?: string;
}

/**
 * Type guard to check if a HydratedFeedItem is a CommentFeedItem.
 * Used in: UltraFeed component
 */
export function isCommentFeedItem(item: any): item is CommentFeedItem {
  return item?.renderAsType === 'feedComment' && item?.primaryComment != null;
}

/**
 * Type guard to check if a HydratedFeedItem is a PostFeedItem.
 * Used in: UltraFeed component
 */
export function isPostFeedItem(item: any): item is PostFeedItem {
  return item?.renderAsType === 'feedPost' && item?.primaryPost != null;
}

/**
 * Ensures the primaryComment from a HydratedFeedItem has the correct shape
 * for use in UltraFeed components.
 * Used in: UltraFeed component
 * 
 * @param feedItem A CommentFeedItem validated with isCommentFeedItem
 * @returns A properly typed UltraFeedComment
 */
export function getUltraFeedComment(feedItem: CommentFeedItem): DisplayFeedComment {
  const comment = feedItem.primaryComment;
  
  // After our server-side hydration process, the comment should have
  // the post field populated. We use a type assertion here because
  // the comment already has all the CommentsList fields plus the post
  // field, which matches the UltraFeedComment interface.
  return comment as unknown as DisplayFeedComment;
}

/**
 * Converts a DbPost to PostsRecentDiscussion 
 * This is needed because FeedPostCommentsCard expects PostsRecentDiscussion.
 * Used in: UltraFeed component
 * 
 * @param feedItem A PostFeedItem validated with isPostFeedItem
 * @returns The post cast to the expected type for FeedPostCommentsCard
 */
export function getPostForFeed(feedItem: PostFeedItem): PostsRecentDiscussion {
  // The post from the feed has the necessary fields
  // Just need to cast to the right type for TypeScript
  return feedItem.primaryPost as unknown as PostsRecentDiscussion;
}

/**
 * Converts DbComment[] to CommentsList[]
 * This is needed because FeedPostCommentsCard expects CommentsList[].
 * Used in: UltraFeed component
 * 
 * @param feedItem A PostFeedItem validated with isPostFeedItem
 * @returns The comments cast to the expected type for FeedPostCommentsCard
 */
export function getCommentsForFeed(feedItem: PostFeedItem): CommentsList[] {
  // The comments from the feed have the necessary fields
  // Just need to cast to the right type for TypeScript
  return (feedItem.secondaryComments || []) as unknown as CommentsList[];
}


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

/**
 * Union type for all possible item content types.
 * Used in: itemContent field in FeedItemServings
 */
export type FeedItemContent = CommentThreadFeedItemContent | PostFeedItemContent;

/**
 * New feed item structure as defined in the UltraFeed schema.
 * This replaces the older types that had separate fields for different content types.
 */
export interface UltraFeedItemResolver {
  _id: string;
  type: string;
  renderAsType: FeedItemRenderType;
  sources: string[];
  itemContent: any; // Any JSON content appropriate for the renderAsType
}
