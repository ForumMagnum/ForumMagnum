// Define source type arrays for runtime iteration

export const feedTypes = ["following", "ultraFeed", "userContent", "bookmarksFeed"] as const;
export type FeedType = typeof feedTypes[number];

export interface PostScoreBreakdownTerms extends Record<string, number> {
  subscribedBonus: number;
  karmaBonus: number;
  topicAffinityBonus: number;
}

export interface ThreadScoreBreakdownTerms extends Record<string, number> {
  unreadSubscribedCommentBonus: number;
  engagementContinuationBonus: number;
  repliesToYouBonus: number;
  yourPostActivityBonus: number;
  overallKarmaBonus: number;
  topicAffinityBonus: number;
  quicktakeBonus: number;
  readPostContextBonus: number;
}

export interface PostScoreBreakdown {
  total: number;
  terms: PostScoreBreakdownTerms;
  typeMultiplier: number;
}

export interface ThreadScoreBreakdown {
  total: number;
  terms: ThreadScoreBreakdownTerms;
  repetitionPenaltyMultiplier: number;
  typeMultiplier: number;
}

export type ScoreBreakdown = PostScoreBreakdown | ThreadScoreBreakdown;

export type RankedItemMetadata = 
  | {
      rankedItemType: 'post';
      scoreBreakdown: PostScoreBreakdown;
      selectionConstraints: string[];
      position: number;
    }
  | {
      rankedItemType: 'commentThread';
      scoreBreakdown: ThreadScoreBreakdown;
      selectionConstraints: string[];
      position: number;
    };

export const feedPostSourceTypesArray = [ 'hacker-news', 'recombee-lesswrong-ultrafeed', 'bookmarks', 'subscriptionsPosts' ] as const;
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
export const feedItemRenderTypes = ["feedCommentThread", "feedPost", "feedSpotlight", "feedSubscriptionSuggestions", "feedMarker"] as const;
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
  isRead?: boolean;
  rankingMetadata?: RankedItemMetadata;
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
  fromSubscribedUser?: boolean;
  isRead?: boolean;
  isParentPostRead?: boolean;
  rankingMetadata?: RankedItemMetadata;
}

export interface FeedSpotlightMetaInfo {
  sources: FeedItemSourceType[];
  servedEventId: string;
  rankingMetadata?: RankedItemMetadata;
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
  fromSubscribedUser?: boolean;
  isRead?: boolean;
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
  postSources?: FeedItemSourceType[];
  rankingMetadata?: RankedItemMetadata;
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
  rankingMetadata?: RankedItemMetadata;
}

export type FeedItem = FeedCommentsThread | FeedSpotlight | FeedFullPost;

export interface FeedCommentsThreadResolverType {
  _id: string;
  comments: DbComment[];
  commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo};
  postSources?: FeedItemSourceType[];
  post?: DbPost | null;
  postMetaInfo?: FeedPostMetaInfo;
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
  rankingMetadata?: RankedItemMetadata;
}

export interface FeedSubscriptionSuggestionsResolverType {
  _id: string;
  suggestedUsers: DbUser[];
}

export interface FeedMarkerResolverType {
  _id: string;
  markerType: string;
  timestamp: Date;
}

export type FeedItemResolverType =
  | FeedPostResolverType
  | FeedCommentsThreadResolverType
  | FeedSpotlightResolverType
  | FeedSubscriptionSuggestionsResolverType
  | FeedMarkerResolverType;

export type UserOrClientId =
  | { type: 'user'; id: string }
  | { type: 'client'; id: string };

export interface UltraFeedResolverType {
  type: FeedItemRenderType;
  feedPost?: FeedPostResolverType;
  feedCommentThread?: FeedCommentsThreadResolverType;
  feedSpotlight?: FeedSpotlightResolverType;
  feedSubscriptionSuggestions?: FeedSubscriptionSuggestionsResolverType;
  feedMarker?: FeedMarkerResolverType;
}

export interface DisplayFeedCommentThread {
  _id: string;
  comments: UltraFeedComment[];
  commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo};
  postSources?: FeedItemSourceType[] | null;
  post?: PostsListWithVotes | null;
  postMetaInfo?: FeedPostMetaInfo;
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
  feedType?: FeedType;
  loggedOut?: boolean;
}
