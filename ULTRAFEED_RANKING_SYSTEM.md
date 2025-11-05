# UltraFeed Ranking System - Implementation Summary

## Overview
We've built a complete scoring-based ranking system to replace weight-based random sampling in the UltraFeed. The system scores items based on quality, relevance, and user preferences, then applies diversity constraints via greedy selection.

## What's Been Implemented

### 1. Core Types (`ultraFeedRanking.ts`)
- **RankableItemBase**: Base interface with `id`, `itemType`, `sources`
- **PostRankableItem**: Full post signals (karma, subscription, recency, etc.)
- **ThreadRankableItem**: Thread signals with per-comment data and engagement stats
- **CommentRankableItem**: Per-comment signals within threads

### 2. Mapping Helpers
- **toPostRankable()**: Converts `FeedFullPost` → `PostRankableItem`
- **toThreadRankable()**: Converts prepared thread → `ThreadRankableItem`

### 3. Scoring Functions

#### Post Scoring (additive, 0-100 scale)
Components:
- **baseScore**: 3 points
- **subscribedBonus**: +15 if from followed author
- **karmaBonus**: karma^1.2 / 20, capped at 20 (superlinear)
- **topicAffinityBonus**: 0-15 based on tag matching (TODO: needs tagRelevance data)
- **recencyBonus**: 10 * exp(-ageHrs / 168), decays over 1 week

Examples:
- Subscribed, 100 karma, fresh: ~55 points
- Non-subscribed, 50 karma, 1 week old: ~11 points

#### Thread Scoring (additive then multiplicative penalty, 0-100 scale)
Components:
- **baseScore**: 5 points
- **unreadSubscribedCommentScore**: sumKarma^1.2 / 20, cap 25
- **engagementContinuationScore**: 20/10/5 for participated/voted/viewed
- **repliesToYouScore**: +20 (TODO: needs detection)
- **yourPostActivityScore**: +20 (TODO: needs detection)
- **overallKarmaScore**: top5UnreadKarma^1.2 / 25, cap 50
- **topicAffinityScore**: 0 (TODO)
- **quicktakeScore**: +10 if quicktake AND top-level unread
- **readPostContextScore**: +5 if you've read the post
- **recencyBonus**: 10 * exp(-ageHrs / 168)
- **repititionPenaltyMultiplier**: (1 - 0.8 * decay)^n for each recent serving (multiplicative!)

The repetition penalty is **multiplicative** and applied AFTER all additive components to ensure it dominates.

### 4. Diversity Constraints

Implemented via greedy selection in `selectWithDiversityConstraints()`:

**Type diversity**: No more than 3 consecutive items of same type
**Guaranteed slots**: 
  - Position 5, 15, 25... → force bookmark if <1 in current window of 10
  - Position 8, 18, 28... → force spotlight if <1 in current window of 10
**Subscription diversity**: If last 5 items all from subscribed authors, force high-karma (≥50) non-subscribed item

### 5. Main Ranking Function

```typescript
export function rankUltraFeedItems(
  items: RankableItem[],
  totalItems: number,
  userTagAffinity?: Map<string, number> | null,
  config: RankingConfig = DEFAULT_RANKING_CONFIG,
  diversityConstraints: DiversityConstraints = DEFAULT_DIVERSITY_CONSTRAINTS
): string[]
```

Returns ordered IDs to be mapped back to full items.

## Hard Constraints (Already Enforced Elsewhere)

These are handled BEFORE items reach the ranking system:
- **Exact thread duplicates**: Filtered in `ultraFeedThreadHelpers.ts` via `servedCommentIdsInSession`
- **All comments read**: Score near-zero naturally (no unread content)
- **Weak thread identity penalty**: Via `servingHoursAgo` in `ThreadEngagementStats` (based on topLevelCommentId, not exact thread)

## Configuration

All parameters are tunable via `DEFAULT_RANKING_CONFIG`:

### Post Config
```typescript
baseScore: 3
subscribedBonus: 15
karmaSuperlinearExponent: 1.2
karmaDivisor: 20
karmaMaxBonus: 20
topicAffinityMaxBonus: 15
recencyBonusMax: 10
recencyDecayHours: 168
```

### Thread Config
```typescript
baseScore: 5
subscribedKarmaExponent: 1.2
subscribedKarmaDivisor: 20
subscribedKarmaMaxBonus: 25
engagementParticipationBonus: 20
engagementVotingBonus: 10
engagementViewingBonus: 5
repliesToYouBonus: 20
yourPostBonus: 20
overallKarmaExponent: 1.2
overallKarmaDivisor: 25
overallKarmaMaxBonus: 50
overallKarmaTopN: 5
quicktakeBonus: 10
readPostContextBonus: 5
recencyBonusMax: 10
recencyDecayHours: 168
repetitionPenaltyStrength: 0.8
repetitionDecayHours: 6
```

### Diversity Config
```typescript
maxConsecutiveSameType: 3
guaranteedSlotsPerWindow: { windowSize: 10, bookmarks: 1, spotlights: 1 }
subscriptionDiversityWindow: 5
subscriptionDiversityMinKarma: 50
```

## Integration with ultraFeedResolver.ts (COMPLETED)

### What was implemented:

1. **✅ Import ranking system**:
```typescript
import { toPostRankable, toThreadRankable, rankUltraFeedItems, RankableItem, MappablePreparedThread } from '../ultraFeed/ultraFeedRanking';
```

2. **✅ Fetch engagement stats separately**:
```typescript
const engagementStatsListPromise = userIdOrClientId && commentFetchLimit > 0
  ? context.repos.comments.getThreadEngagementStatsForRecentlyActiveThreads(...)
  : Promise.resolve([]);
```

3. **✅ Convert all fetched items to RankableItem[]**:
- Posts: `toPostRankable(post, now)`
- Threads: `toThreadRankable(thread, engagement, now)` with engagement stats looked up by topLevelId
- Spotlights: Minimal rankable with sources=['spotlights'], karma=0
- Bookmarks: Minimal rankable with sources=['bookmarks'], mapped by type (post or thread)

4. **✅ Call ranking function**:
```typescript
const rankedIds = rankUltraFeedItems(rankableItems, limit);
```

5. **✅ Map ranked IDs back to original items**:
- Created separate maps for posts, threads, spotlights, bookmarks
- Mapped ranked IDs to SampledItem[] in order
- Preserved existing deduplication and subscription suggestion insertion

6. **✅ Keep existing flow**:
- `dedupSampledItems()` still runs
- `insertSubscriptionSuggestions()` still runs
- `deduplicatePostsInThreads()` still runs
- All downstream transformations unchanged

## TODOs (Stubbed for Now)

### Data Needed
1. **hasRepliesToYou**: Detect if any unread comment in thread is a reply to user's comment
2. **isYourPost**: Detect if thread's post was authored by current user
3. **Topic affinity**: 
   - Fetch `repos.posts.getUserReadsPerCoreTag(userId)` per session
   - Add `tagRelevance` to PostRankableItem
   - Implement `calculateTopicAffinityBonus()` for both posts and threads

### Testing
- Unit tests for scoring functions with known inputs
- Integration test comparing old vs new feed ordering
- A/B test framework to measure engagement improvements

## Key Design Decisions

1. **Additive scoring** for transparency and tunability
2. **Multiplicative repetition penalty** to ensure it dominates
3. **Greedy selection** for diversity instead of score penalties
4. **Separation of concerns**: scoring → sorting → constraint-based selection
5. **Externalized config** for easy tuning without code changes
6. **Thread repetition based on topLevelCommentId** (weak identity) not exact thread hash

## Files Modified
- ✅ `packages/lesswrong/server/ultraFeed/ultraFeedRanking.ts` (NEW, 642 lines) - Complete ranking system
- ✅ `packages/lesswrong/server/resolvers/ultraFeedResolver.ts` - Integrated ranking system, replaced weightedSample()
- ✅ `ULTRAFEED_RANKING_SYSTEM.md` (NEW, 208 lines) - This documentation

## Deprecated Code (Still Present But Unused)
- `weightedSample()` function - removed, replaced by ranking
- `createSourcesMap()` function - no longer called (could be removed in cleanup)

