// Scoring configuration
export interface RankingConfig {
  posts: {
    startingValue: number;
    subscribedBonus: number;
    // HN-style decay parameters (used for hacker-news posts)
    hnDecayFactor: number; // Exponent in (age + bias)^factor
    hnDecayBias: number; // Bias added to age in hours
    // Legacy karma bonus (used for recombee/subscription posts without decay)
    karmaSuperlinearExponent: number;
    karmaDivisor: number;
    karmaMaxBonus: number;
    topicAffinityMaxBonus: number;
  };
  threads: {
    startingValue: number;
    // HN-style decay for individual non-subscribed comments
    commentDecayFactor: number;
    commentDecayBias: number;
    subscribedCommentBonus: number; // Bonus added per comment from subscribed author
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
  posts: {
    startingValue: 1,
    subscribedBonus: 15,
    hnDecayFactor: 1.3,
    hnDecayBias: 2,
    karmaSuperlinearExponent: 1.2,
    karmaDivisor: 20,
    karmaMaxBonus: 20,
    topicAffinityMaxBonus: 15,
  },
  threads: {
    startingValue: 2,
    commentDecayFactor: 1.3,
    commentDecayBias: 2,
    subscribedCommentBonus: 6, // +6 per comment from subscribed author (subscribedBonusSetting=3 * 2)
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
}

export const DEFAULT_DIVERSITY_CONSTRAINTS: DiversityConstraints = {
  maxConsecutiveSameType: 3,
  guaranteedSlotsPerWindow: {
    windowSize: 10,
    bookmarks: 1,
    spotlights: 1,
  },
  subscriptionDiversityWindow: 5,
};

/**
 * Build a RankingConfig from user settings.
 * Allows users to customize decay strengths, starting values, and bonuses.
 */
export function buildRankingConfigFromSettings(unifiedScoring: {
  subscribedBonusSetting: number;
  quicktakeBonus: number;
  postsTimeDecayStrength: number;
  commentsTimeDecayStrength: number;
  postsStartingValue: number;
  threadsStartingValue: number;
}): RankingConfig {
  const postSubscribedBonus = unifiedScoring.subscribedBonusSetting * 5;
  const commentSubscribedBonus = unifiedScoring.subscribedBonusSetting * 2;
  
  return {
    posts: {
      startingValue: unifiedScoring.postsStartingValue,
      subscribedBonus: postSubscribedBonus,
      hnDecayFactor: unifiedScoring.postsTimeDecayStrength,
      hnDecayBias: 2, // Keep bias constant for now
      karmaSuperlinearExponent: 1.2,
      karmaDivisor: 20,
      karmaMaxBonus: 20,
      topicAffinityMaxBonus: 15,
    },
    threads: {
      startingValue: unifiedScoring.threadsStartingValue,
      commentDecayFactor: unifiedScoring.commentsTimeDecayStrength,
      commentDecayBias: 2, // Keep bias constant for now
      subscribedCommentBonus: commentSubscribedBonus,
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

