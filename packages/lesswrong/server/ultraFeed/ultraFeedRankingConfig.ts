// Scoring configuration

// See ultraFeedRanking.ts for more details on how these parameters are used to score items and to check the comments here are up to date.
// Karma bonuses are calculated differently for "timeless" content (e.g. Recombee recommendations, Bookmarks, etc) vs "timeful" content (e.g. recent posts).
// The later has its karma score contribution calculated with a hyperbolic delay whereas the former does not.
export interface RankingConfig {
  startingValue: number; // Set to 1 so that if items have a type multiplier, it has something to multiple even if no other bonuses are applied
  posts: {
    typeMultiplier: number;
    subscribedBonus: number;

    // Time decay parameters (hyperbolic)
    // Formula: karmaBonus = min(karma * scale^exponent / (ageHrs + bias)^exponent, maxBonus)
    timeDecayBias: number; // Bias added to age (prevents division by zero, softens early decay)
    timeDecayScale: number; // Scale factor (controls overall decay rate)
    timeDecayExponent: number; // Fixed at 1 for simple hyperbolic decay

    // Timeless karma bonuses
    // Formula: karmaBonus = min(karma^exponent / divisor, maxBonus)
    karmaSuperlinearExponent: number;
    karmaDivisor: number;
    karmaMaxBonus: number;
    topicAffinityMaxBonus: number;
  };
  threads: {
    typeMultiplier: number;
    timeDecayBias: number;
    timeDecayScale: number;
    timeDecayExponent: number;
    subscribedCommentBonus: number;
    karmaMaxBonus: number;
    engagementParticipationBonus: number;
    engagementVotingBonus: number;
    engagementViewingBonus: number;
    repliesToYouBonus: number;
    yourPostBonus: number;
    quicktakeBonus: number;
    readPostContextBonus: number;
    repetitionPenaltyStrength: number;
    repetitionDecayHours: number;
  };
  maxScore: number;
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  startingValue: 1,
  posts: {
    typeMultiplier: 1.0,
    subscribedBonus: 6,
    timeDecayBias: 12,
    timeDecayScale: 12,
    timeDecayExponent: 0.25,
    karmaSuperlinearExponent: 1.2,
    karmaDivisor: 20,
    karmaMaxBonus: 20,
    topicAffinityMaxBonus: 15,
  },
  threads: {
    typeMultiplier: 1.0,
    timeDecayBias: 12,
    timeDecayScale: 12,
    timeDecayExponent: 0.25,
    subscribedCommentBonus: 6,
    karmaMaxBonus: 20,
    engagementParticipationBonus: 20,
    engagementVotingBonus: 10,
    engagementViewingBonus: 5,
    repliesToYouBonus: 20,
    yourPostBonus: 20,
    quicktakeBonus: 5,
    readPostContextBonus: 3,
    repetitionPenaltyStrength: 0.8,
    repetitionDecayHours: 6,
  },
  maxScore: 100,
};

export interface DiversityConstraints {
  maxConsecutiveSameType: number; 
  guaranteedSlotsPerWindow: {
    windowSize: number; 
    bookmarks: number;  
    spotlights: number; 
  };
  subscriptionDiversityWindow: number;
  sourceDiversityWindow: number;
}

export const DEFAULT_DIVERSITY_CONSTRAINTS: DiversityConstraints = {
  maxConsecutiveSameType: 5,
  guaranteedSlotsPerWindow: {
    windowSize: 20,
    bookmarks: 1,
    spotlights: 1,
  },
  subscriptionDiversityWindow: 5,
  sourceDiversityWindow: 5,
};

export function buildRankingConfigFromSettings(unifiedScoring: {
  subscribedBonusSetting: number;
  quicktakeBonus: number;
  timeDecayHalfLifeHours: number;
  postsMultiplier: number;
  threadsMultiplier: number;
}): RankingConfig {
  const postSubscribedBonus = unifiedScoring.subscribedBonusSetting * 2;
  const commentSubscribedBonus = unifiedScoring.subscribedBonusSetting * 2;
  const timeDecayHalfLifeHours = unifiedScoring.timeDecayHalfLifeHours;
  
  return {
    startingValue: 1,
    posts: {
      typeMultiplier: unifiedScoring.postsMultiplier,
      subscribedBonus: postSubscribedBonus,
      timeDecayBias: 12,
      timeDecayScale: timeDecayHalfLifeHours,
      timeDecayExponent: 0.25,
      karmaSuperlinearExponent: 1.2,
      karmaDivisor: 20,
      karmaMaxBonus: 20,
      topicAffinityMaxBonus: 15,
    },
    threads: {
      typeMultiplier: unifiedScoring.threadsMultiplier,
      timeDecayBias: 12,
      timeDecayScale: timeDecayHalfLifeHours,
      timeDecayExponent: 0.25,
      subscribedCommentBonus: commentSubscribedBonus,
      karmaMaxBonus: 20,
      engagementParticipationBonus: 20,
      engagementVotingBonus: 10,
      engagementViewingBonus: 5,
      repliesToYouBonus: 20,
      yourPostBonus: 20,
      quicktakeBonus: unifiedScoring.quicktakeBonus,
      readPostContextBonus: 3,
      repetitionPenaltyStrength: 0.8,
      repetitionDecayHours: 6,
    },
    maxScore: 100,
  };
}

