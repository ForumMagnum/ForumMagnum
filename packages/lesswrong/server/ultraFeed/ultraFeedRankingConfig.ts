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
    // HN-style decay: score = karma / (ageHours + 2)^1.8
    // Standard HN values (SCORE_BIAS=2, TIME_DECAY_FACTOR=1.8)
    hnDecayFactor: 1.3,
    hnDecayBias: 2,
    // Legacy karma bonus for recombee/subscription posts (no decay)
    karmaSuperlinearExponent: 1.2,
    karmaDivisor: 20,
    karmaMaxBonus: 20,
    topicAffinityMaxBonus: 15,
  },
  threads: {
    startingValue: 2,
    // Comment decay: score = (karma + 1) / (ageHours + 2)^1.3 (milder than posts)
    // Only applied to non-subscribed comments
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

