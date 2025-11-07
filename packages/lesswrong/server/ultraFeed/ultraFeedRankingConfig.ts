// Scoring configuration
export interface RankingConfig {
  startingValue: number; // Base starting value for all items (before type multiplier)
  posts: {
    typeMultiplier: number; // Multiplier applied to final post score
    subscribedBonus: number;
    // Time decay parameters (hyperbolic)
    // Formula: multiplier = 1 / ((ageHrs + bias) / scale)^exponent
    //        = scale^exponent / (ageHrs + bias)^exponent
    timeDecayBias: number; // Bias added to age (prevents division by zero, softens early decay)
    timeDecayScale: number; // Scale factor (controls overall decay rate)
    timeDecayExponent: number; // Fixed at 1 for simple hyperbolic decay
    // Legacy karma bonus (used for recombee/subscription posts without decay)
    karmaSuperlinearExponent: number;
    karmaDivisor: number;
    karmaMaxBonus: number;
    topicAffinityMaxBonus: number;
  };
  threads: {
    typeMultiplier: number; // Multiplier applied to final thread score
    // Time decay for comments
    // Formula: multiplier = 1 / ((ageHrs + bias) / scale)^exponent
    //        = scale^exponent / (ageHrs + bias)^exponent
    timeDecayBias: number; // Bias added to age (prevents division by zero, softens early decay)
    timeDecayScale: number; // Scale factor (controls overall decay rate)
    timeDecayExponent: number; // Fixed at 1 for simple hyperbolic decay
    subscribedCommentBonus: number; // Bonus added per comment from subscribed author
    karmaMaxBonus: number; // Maximum karma bonus from all comments combined
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
    subscribedBonus: 6, // subscribedBonusSetting=3 * 2
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
    subscribedCommentBonus: 6, // subscribedBonusSetting=3 * 2
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
  maxConsecutiveSameType: 3,
  guaranteedSlotsPerWindow: {
    windowSize: 20,
    bookmarks: 1,
    spotlights: 1,
  },
  subscriptionDiversityWindow: 5,
  sourceDiversityWindow: 3,
};

/**
 * Build a RankingConfig from user settings.
 * Allows users to customize decay parameters, starting values, and bonuses.
 */
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
      timeDecayBias: 12, // Fixed bias
      timeDecayScale: timeDecayHalfLifeHours, // Use half-life as scale parameter
      timeDecayExponent: 0.25, // Gentle decay with long tail
      karmaSuperlinearExponent: 1.2,
      karmaDivisor: 20,
      karmaMaxBonus: 20,
      topicAffinityMaxBonus: 15,
    },
    threads: {
      typeMultiplier: unifiedScoring.threadsMultiplier,
      timeDecayBias: 12, // Fixed bias
      timeDecayScale: timeDecayHalfLifeHours, // Use half-life as scale parameter
      timeDecayExponent: 0.25, // Gentle decay with long tail
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

