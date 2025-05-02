// Define source type arrays for runtime iteration
export const feedPostSourceTypesArray = [ 'hacker-news', 'recombee-lesswrong-custom', 'bookmarks' ] as const;
export const feedCommentSourceTypesArray = ['recentComments'] as const;
export const feedSpotlightSourceTypesArray = ['spotlights'] as const;

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
 
export type FeedItemDisplayStatus = "expanded" | "collapsed" | "hidden";
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
  displayStatus: FeedItemDisplayStatus;
}
export interface FeedCommentMetaInfo {
  sources: FeedItemSourceType[] | null;
  directDescendentCount: number;
  lastServed: Date | null;
  lastViewed: Date | null;
  lastInteracted: Date | null;
  postedAt: Date | null;
  displayStatus?: FeedItemDisplayStatus;
  highlight?: boolean;
}

export interface FeedCommentFromDb {
  commentId: string;
  topLevelCommentId: string;
  postId: string;
  parentCommentId: string | null;
  baseScore: number;
  shortform: boolean | null;
  sources: string[];
  lastServed: Date | null;
  lastViewed: Date | null;
  lastInteracted: Date | null;
  postedAt: Date | null;
}

export interface FeedPostFromDb extends DbPost {
  sourceType: FeedItemSourceType;
  lastServed: Date | null;
  lastViewed: Date | null;
  lastInteracted: Date | null;
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
}

export interface FeedFullPost {
  post: Partial<DbPost>;
  postMetaInfo: FeedPostMetaInfo;
}

export interface FeedSpotlight {
  spotlightId: string;
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
  sessionId: string;
}
