/**
 * Type definitions for UltraFeed components
 */

/**
 * The type of comments used in UltraFeed components.
 * This extends CommentsList to include the post field that's needed
 * for proper rendering in the UltraFeed components.
 */
export interface UltraFeedComment extends CommentsList {
  post: PostsMinimumInfo | null;
}

/**
 * Type for feed items containing a comment
 * This is a specialization of HydratedFeedItem where we know:
 * - renderAsType is 'feedComment'
 * - primaryComment is not null
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
 * Type for feed items containing a post
 * This is a specialization of HydratedFeedItem where we know:
 * - renderAsType is 'feedPost'
 * - primaryPost is not null
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
 * Type guard to check if a HydratedFeedItem is a CommentFeedItem
 */
export function isCommentFeedItem(item: any): item is CommentFeedItem {
  return item?.renderAsType === 'feedComment' && item?.primaryComment != null;
}

/**
 * Type guard to check if a HydratedFeedItem is a PostFeedItem
 */
export function isPostFeedItem(item: any): item is PostFeedItem {
  return item?.renderAsType === 'feedPost' && item?.primaryPost != null;
}

/**
 * Ensures the primaryComment from a HydratedFeedItem has the correct shape
 * for use in UltraFeed components
 * 
 * @param feedItem A CommentFeedItem validated with isCommentFeedItem
 * @returns A properly typed UltraFeedComment
 */
export function getUltraFeedComment(feedItem: CommentFeedItem): UltraFeedComment {
  const comment = feedItem.primaryComment;
  
  // After our server-side hydration process, the comment should have
  // the post field populated. We use a type assertion here because
  // the comment already has all the CommentsList fields plus the post
  // field, which matches the UltraFeedComment interface.
  return comment as unknown as UltraFeedComment;
}

//TODO: get rid of this eventually
/**
 * Converts a DbPost to PostsRecentDiscussion 
 * This is needed because FeedPostCommentsCard expects PostsRecentDiscussion
 * 
 * @param feedItem A PostFeedItem validated with isPostFeedItem
 * @returns The post cast to the expected type for FeedPostCommentsCard
 */
export function getPostForFeed(feedItem: PostFeedItem): PostsRecentDiscussion {
  // The post from the feed has the necessary fields
  // Just need to cast to the right type for TypeScript
  return feedItem.primaryPost as unknown as PostsRecentDiscussion;
}

//TODO: get rid of this eventually
/**
 * Converts DbComment[] to CommentsList[]
 * This is needed because FeedPostCommentsCard expects CommentsList[]
 * 
 * @param feedItem A PostFeedItem validated with isPostFeedItem
 * @returns The comments cast to the expected type for FeedPostCommentsCard
 */
export function getCommentsForFeed(feedItem: PostFeedItem): CommentsList[] {
  // The comments from the feed have the necessary fields
  // Just need to cast to the right type for TypeScript
  return (feedItem.secondaryComments || []) as unknown as CommentsList[];
}

/**
 * Type representing a source/reason why a comment was selected
 * to potentially be shown in the feed
 */
export type FeedItemSourceType = 'QuickTake' | 'PopularComment' | string;

/**
 * Interface for a candidate comment that might be displayed in the feed
 */
export interface FeedCommentCandidate {
  comment: FeedCommentItemFragment;
  sources: FeedItemSourceType[] | null;
}

/**
 * Interface for a comment item that will be displayed in the feed
 * TODO: just extend existing Comment type??
 */
export interface FeedCommentItemDisplay {
  commentId: string;
  postId: string;
  user: UsersMinimumInfo; // User who wrote the comment
  postedAt: Date;
  baseScore: number;
  content: string; // HTML/text content
  parentCommentId: string | null;
  displayedChild: FeedCommentItemDisplay | null; // Child comment displayed in thread
  numberOfTimesPreviouslySeen: number; // Whether currentUser has seen this comment
  suggestInitiallyExpanded: boolean; // Whether comment should start expanded
  sources: FeedItemSourceType[] | null; // Reasons why comment was selected
  nonDisplayedChildrenCount?: number; // Number of children not displayed
}

/**
 * Interface for a linear thread of comments to be displayed in the feed
 */
export interface FeedCommentThread {
  post: PostsMinimumInfo; // Contains what's needed to display a post card
  comments: FeedCommentCandidate[]; // List of comments in the thread
  topLevelCommentId: string; // ID of the first comment in the thread
  servingId: string; // Used for setting up analytics
}
