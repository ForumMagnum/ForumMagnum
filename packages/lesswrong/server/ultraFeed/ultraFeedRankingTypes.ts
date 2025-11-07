import { FeedItemSourceType, PreDisplayFeedComment, ThreadEngagementStats } from '@/components/ultraFeed/ultraFeedTypes';

export type RankableItemType = 'post' | 'commentThread' | 'spotlight' | 'bookmark' | 'subscriptionSuggestions';

export interface RankableItemBase {
  id: string;
  itemType: RankableItemType;
  sources?: FeedItemSourceType[];
}

export interface PostRankableItem extends RankableItemBase {
  itemType: 'post';
  postId: string;

  sources: FeedItemSourceType[];
  ageHrs: number | null; // null for items without meaningful age (like spotlights)
  isRead: boolean;
  userSubscribedToAuthor: boolean;
  karma: number;
  initialFilteredScore?: number;
}

export interface CommentRankableItem {
  commentId: string;
  ageHrs: number;
  isRead: boolean;
  userSubscribedToAuthor: boolean;
  karma: number;
  isInitialCandidate?: boolean;
  primarySource?: FeedItemSourceType;
  descendentCount?: number;
  directDescendentCount?: number;
}

export interface ThreadAggregateStats {
  commentCount: number;
  unviewedCount: number;
  lastActivityAgeHrs: number;
  hasShortform: boolean;
  maxCommentKarma?: number;
}

export interface ThreadRankableItem extends RankableItemBase {
  itemType: 'commentThread';
  threadId: string;
  sources: FeedItemSourceType[];
  ageHrs: number; // based on most recent comment postedAt
  isRead: boolean;
  userSubscribedToAuthor: boolean; // true if any comment is from a subscribed author
  engagement?: ThreadEngagementStats; // optional; available if supplied by caller
  stats: ThreadAggregateStats;
  comments: CommentRankableItem[];
}

export type RankableItem = PostRankableItem | ThreadRankableItem;

// Score transparency types
export interface PostScoreBreakdown {
  total: number;
  components: {
    subscribedBonus: number;
    karmaBonus: number;
    topicAffinityBonus: number;
  };
  typeMultiplier: number;
}

export interface ThreadScoreBreakdown {
  total: number;
  components: {
    unreadSubscribedCommentBonus: number;
    engagementContinuationBonus: number;
    repliesToYouBonus: number;
    yourPostActivityBonus: number;
    overallKarmaBonus: number;
    topicAffinityBonus: number;
    quicktakeBonus: number;
    readPostContextBonus: number;
  };
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

/**
 * Minimal shape required from the thread source for mapping.
 * We only rely on comments and optionally primarySource.
 */
export interface MappablePreparedThread {
  comments: PreDisplayFeedComment[];
  primarySource?: FeedItemSourceType;
}

