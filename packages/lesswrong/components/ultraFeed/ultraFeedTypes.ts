// Define source type arrays for runtime iteration
export const feedPostSourceTypesArray = [ 'hacker-news', 'recombee-lesswrong-custom', 'bookmarks', 'subscriptionsPosts' ] as const;
export const feedCommentSourceTypesArray = ['quicktakes', 'recentComments', 'subscriptionsComments', 'bookmarks'] as const;
export const feedSpotlightSourceTypesArray = ['spotlights'] as const;
export const allFeedItemSourceTypes = [
  ...feedPostSourceTypesArray,
  ...feedCommentSourceTypesArray,
  ...feedSpotlightSourceTypesArray,
] as const;

// Define types based on the arrays
export type FeedPostSourceType = typeof feedPostSourceTypesArray[number];
export type FeedCommentSourceType = typeof feedCommentSourceTypesArray[number];
export type FeedSpotlightSourceType = typeof feedSpotlightSourceTypesArray[number];

// Combined type for all possible sources
export type FeedItemSourceType = FeedPostSourceType | FeedCommentSourceType | FeedSpotlightSourceType;

// Define render types
export const feedItemRenderTypes = ["feedCommentThread", "feedPost", "feedSpotlight"] as const;
export type FeedItemRenderType = typeof feedItemRenderTypes[number];

export type FeedItemType = FeedItemRenderType | "feedComment";
 
export type FeedItemDisplayStatus = "expanded" | "collapsed" | "hidden" | "expandedToMaxInPlace";
export interface RecombeeMetaInfo {
  scenario: string;
  recommId: string;
  generatedAt: Date;
}
export interface FeedPostMetaInfo {
  recommInfo?: RecombeeMetaInfo;
  sources: FeedItemSourceType[];
  lastServed?: Date | null;
  lastViewed?: Date | null;
  lastInteracted?: Date | null;
  highlight: boolean;
  displayStatus: FeedItemDisplayStatus;
  servedEventId?: string;
}
export interface FeedCommentMetaInfo {
  sources: FeedItemSourceType[];
  descendentCount: number;
  /** @deprecated Use descendentCount instead. This field previously had a typo and only counted direct children. */
  directDescendentCount?: number;
  lastServed?: Date | null;
  lastViewed?: Date | null;
  lastInteracted?: Date | null;
  postedAt?: Date | null;
  highlight?: boolean;
  displayStatus?: FeedItemDisplayStatus;
  servedEventId?: string;
}

export interface FeedSpotlightMetaInfo {
  sources: FeedItemSourceType[];
  servedEventId: string;
}

export interface FeedCommentFromDb {
  commentId: string;
  authorId: string;
  topLevelCommentId: string;
  postId: string;
  parentCommentId: string | null;
  baseScore: number;
  shortform: boolean | null;
  sources: string[];
  primarySource?: string;
  isInitialCandidate?: boolean;
  lastServed: Date | null;
  lastViewed: Date | null;
  lastInteracted: Date | null;
  postedAt: Date | null;
  descendentCount?: number;
}

export interface PreDisplayFeedComment {
  commentId: string;
  postId: string;
  baseScore: number;
  topLevelCommentId?: string | null;
  metaInfo: FeedCommentMetaInfo | null;
}

export type PreDisplayFeedCommentThread = PreDisplayFeedComment[];

export interface FeedCommentsThread {
  comments: PreDisplayFeedComment[];
  primarySource?: FeedItemSourceType;
}

export interface FeedPostStub {
  postId: string;
  postMetaInfo: FeedPostMetaInfo;
}

export interface FeedFullPost {
  post: Partial<DbPost>;
  postMetaInfo: FeedPostMetaInfo;
}

export interface FeedSpotlight {
  spotlightId: string;
  documentType: string;
  documentId: string;
}

export type FeedItem = FeedCommentsThread | FeedSpotlight | FeedFullPost;

export interface FeedCommentsThreadResolverType {
  _id: string;
  comments: DbComment[];
  commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo};
}

export interface FeedPostResolverType {
  _id: string;
  post: Partial<DbPost>;
  postMetaInfo: FeedPostMetaInfo;
}

export interface FeedSpotlightResolverType {
  _id: string;
  spotlight: DbSpotlight;
  post?: DbPost;
  spotlightMetaInfo: FeedSpotlightMetaInfo;
}

export type FeedItemResolverType = FeedPostResolverType | FeedCommentsThreadResolverType | FeedSpotlightResolverType;

export interface UltraFeedResolverType {
  type: FeedItemRenderType;
  feedPost?: FeedPostResolverType;
  feedCommentThread?: FeedCommentsThreadResolverType;
  feedSpotlight?: FeedSpotlightResolverType;
}

export interface DisplayFeedCommentThread {
  _id: string;
  comments: UltraFeedComment[];
  commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo};
}

export interface DisplayFeedPost {
  _id: string;
  postMetaInfo: FeedPostMetaInfo;
  post: PostsListWithVotes;
}


/**
 * Statistics about a thread, used for prioritization.
 */
export interface LinearCommentThreadStatistics {
  commentCount: number;
  maxKarma: number;
  sumKarma: number;
  sumKarmaSquared: number;
  averageKarma: number;
  averageTop3Comments: number;
}

export interface UltraFeedAnalyticsContext {
  feedSessionId: string;
}
export interface ThreadEngagementStats {
  threadTopLevelId: string;
  votingActivityScore: number;
  participationCount: number;
  viewScore: number;
  isOnReadPost: boolean;
  recentServingCount: number;
  servingHoursAgo: number[];
}

export interface ServedEventData {
  sessionId: string;    // The session ID for the feed load
  itemIndex: number;    // The index of the item in the served results array
  commentIndex?: number; // The index of the comment within a thread, if applicable
  displayStatus?: FeedItemDisplayStatus;
  sources: FeedItemSourceType[];
}
