// Define source type arrays
export const feedPostSourceTypesArray = ['recombee-lesswrong-custom', 'hacker-news', 'welcome-post', 'curated', 'stickied'] as const;
export const feedCommentSourceTypesArray = ['quickTakes', 'topComments'] as const;
export const feedSpotlightSourceTypesArray = ['spotlights'] as const;

// Derive types from arrays
export type FeedPostSourceType = typeof feedPostSourceTypesArray[number];
export type FeedCommentSourceType = typeof feedCommentSourceTypesArray[number];
export type FeedSpotlightSourceType = typeof feedSpotlightSourceTypesArray[number];

export type FeedItemSourceType = FeedPostSourceType | FeedCommentSourceType | FeedSpotlightSourceType;
export const feedItemRenderTypes = ["feedCommentThread", "feedPost", "feedSpotlight"] as const;
export type FeedItemRenderType = typeof feedItemRenderTypes[number];
 
export type FeedItemDisplayStatus = "expanded" | "collapsed" | "hidden";
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
  sources: FeedItemSourceType[] | null;
  siblingCount: number | null;
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
  parentCommentId: string;
  postId: string;
  baseScore: number;
  sources: string[];
  lastServed: Date | null;
  lastViewed: Date | null;
  lastInteracted: Date | null;
  postedAt: Date | null;
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


