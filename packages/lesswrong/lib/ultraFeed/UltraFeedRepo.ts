/**
 * Repository for UltraFeed operations
 * 
 * Contains methods for retrieving, filtering, and organizing comment threads 
 * for the UltraFeed system.
 */

import { FeedCommentFromDb, FeedItemSourceType, FeedSpotlight, PreDisplayFeedComment, PreDisplayFeedCommentThread, FeedItemDisplayStatus, FeedFullPost, FeedPostMetaInfo, FeedCommentsThread } from '../../components/ultraFeed/ultraFeedTypes';
import Comments from '../../server/collections/comments/collection';
import AbstractRepo from '../../server/repos/AbstractRepo';
import { recordPerfMetrics } from '../../server/repos/perfMetricWrapper';

import { prioritizeThreads, prepareCommentThreadForResolver  } from './ultraFeedThreadHelpers';

// Import necessary recombee types and functions
import { recombeeApi, recombeeRequestHelpers } from '../../server/recombee/client';
import { HybridRecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';

/**
 * Statistics to help prioritize which threads to display
 */
export interface ThreadStatistics {
  commentCount: number;
  maxKarma: number;
  sumKarma: number;
  sumKarmaSquared: number;
  averageKarma: number;
  averageTop3Comments: number;
}

class UltraFeedRepo extends AbstractRepo<"Comments"> {
  constructor() {
    super(Comments);
  }

  public async getUltraFeedPostThreads(
    context: ResolverContext,
    limit = 20,
    servedPostIds: Set<string> = new Set()
  ): Promise<FeedFullPost[]> {
    console.log(`UltraFeedRepo: getUltraFeedPostThreads called. Limit: ${limit}. Already served post IDs:`, Array.from(servedPostIds));

    const { currentUser } = context;
    const recombeeUser = recombeeRequestHelpers.getRecombeeUser(context);
    let displayPosts: FeedFullPost[] = [];

    if (!recombeeUser) {
      console.warn("UltraFeedRepo: No Recombee user found (likely logged out). Cannot fetch hybrid recommendations.");
    } else {
      const settings: HybridRecombeeConfiguration = {
        hybridScenarios: { fixed: 'forum-classic', configurable: 'recombee-lesswrong-custom' },
        excludedPostIds: Array.from(servedPostIds),
        filterSettings: currentUser?.frontpageFilterSettings,
      };

      try {
        const recommendedResults = await recombeeApi.getHybridRecommendationsForUser(
          recombeeUser,
          limit,
          settings,
          context
        );

        displayPosts = recommendedResults.map((item): FeedFullPost | null => {
           if (!item.post?._id) return null;

           const sources: FeedItemSourceType[] = item.scenario ? [item.scenario as FeedItemSourceType] : ['postThreads'];

           return {
             post: item.post,
             postMetaInfo: {
               sources: sources,
               displayStatus: 'expanded',
               recommInfo: (item.recommId && item.generatedAt) ? {
                 recommId: item.recommId,
                 scenario: item.scenario,
                 generatedAt: item.generatedAt,
               } : undefined,
             },
           };
        }).filter((p): p is FeedFullPost => p !== null);

      } catch (error) {
        console.error("Error calling getHybridRecommendationsForUser:", error);
      }
    }
    
    return displayPosts; 
  }

  //TODO: add comments on threads you've partificipated in/interacted with, especially replies to you
  //TODO: filter based on previous interactions with comments?
  //TODO: figure out exact threshold / date window (make parameter?), perhaps make a window that's adjusted based on user's visit frequency


  async getCommentsForFeed(context: ResolverContext, limit = 200): Promise<FeedCommentFromDb[]> {
    const db = this.getRawDb();
    // Get current user ID for filtering events
    const userId = context.userId;

    console.log(`UltraFeedRepo.getCommentsForFeed called with limit=${limit}, userId=${userId}`);

    // Factor out the filter clause for more clarity
    const FEED_COMMENT_FILTER_CLAUSE = `
      c."postedAt" > NOW() - INTERVAL '180 days'
      AND c.deleted IS NOT TRUE
      AND c.retracted IS NOT TRUE
      AND c."authorIsUnreviewed" IS NOT TRUE
      AND "postId" IS NOT NULL
    `;

    // Query needs to join with UltraFeedEvents and aggregate timestamps
    const suggestedComments: FeedCommentFromDb[] = await db.manyOrNone(`
      -- UltraFeedRepo.getCommentsForFeed
      WITH
      "CommentEvents" AS (
        SELECT
          "documentId",
          MAX(CASE WHEN "eventType" = 'served' THEN "createdAt" END) AS "lastServed",
          MAX(CASE WHEN "eventType" = 'viewed' THEN "createdAt" END) AS "lastViewed",
          MAX(CASE WHEN "eventType" = 'expanded' THEN "createdAt" END) AS "lastInteracted" -- Treat 'expanded' as interacted for now
        FROM "UltraFeedEvents"
        -- Filter for relevant events for the current user and comments
        WHERE "userId" = $(userId)
          AND "collectionName" = 'Comments' -- Only consider events for comments
          AND "eventType" IN ('served', 'viewed', 'expanded')
        GROUP BY "documentId"
      ),
      "PopularCommentsBase" AS (
        SELECT
          c._id AS "commentId",
          c."topLevelCommentId",
          c."postId",
          c."parentCommentId",
          c."baseScore",
          c."postedAt",
          'topComments' AS source
        FROM "Comments" c
        WHERE ${FEED_COMMENT_FILTER_CLAUSE}
          AND c."baseScore" > 20
        ORDER BY c."baseScore" DESC
        LIMIT $(limit)
      ),
      "QuickTakesBase" AS (
        SELECT
          c._id AS "commentId",
          c."topLevelCommentId",
          c."postId",
          c."parentCommentId",
          c."baseScore",
          c."postedAt",
          'quickTake' AS source
        FROM "Comments" c
        WHERE ${FEED_COMMENT_FILTER_CLAUSE}
          AND c.shortform IS TRUE
        ORDER BY c."postedAt" DESC
        LIMIT $(limit)
      ),
      "AllSuggestedCommentsBase" AS (
        SELECT
          sub."commentId",
          sub."topLevelCommentId",
          sub."parentCommentId",
          sub."baseScore",
          sub."postId",
          sub."postedAt",
          ARRAY_AGG(sub.source) AS sources
        FROM (
          SELECT * FROM "PopularCommentsBase"
          UNION
          SELECT * FROM "QuickTakesBase"
        ) sub
        GROUP BY sub."commentId", sub."topLevelCommentId", sub."postId", sub."parentCommentId", sub."baseScore", sub."postedAt"
      ),
      "OtherCommentsBase" AS (
        SELECT
          c._id AS "commentId",
          c."topLevelCommentId",
          c."parentCommentId",
          c."baseScore",
          c."postId",
          c."postedAt",
          ARRAY[]::TEXT[] AS sources
        FROM "Comments" c
        WHERE (
          c."topLevelCommentId" IN (SELECT "topLevelCommentId" FROM "AllSuggestedCommentsBase")
          OR c._id IN (SELECT "topLevelCommentId" FROM "AllSuggestedCommentsBase")
        )
          AND ${FEED_COMMENT_FILTER_CLAUSE}
          AND c."_id" NOT IN (SELECT "commentId" FROM "AllSuggestedCommentsBase")
      ),
      -- Combine all potential comments
      "CombinedComments" AS (
        SELECT "commentId", "topLevelCommentId", "parentCommentId", "postId", "baseScore", "postedAt", "sources" FROM "AllSuggestedCommentsBase"
        UNION
        SELECT "commentId", "topLevelCommentId", "parentCommentId", "postId", "baseScore", "postedAt", "sources" FROM "OtherCommentsBase"
      )
      -- Final SELECT: Join comments with their event timestamps
      SELECT
        cc."commentId",
        cc."topLevelCommentId",
        cc."parentCommentId",
        cc."postId",
        cc."baseScore",
        cc."postedAt",
        cc."sources",
        ce."lastServed",
        ce."lastViewed",
        ce."lastInteracted"
      FROM "CombinedComments" cc
      LEFT JOIN "CommentEvents" ce ON cc."commentId" = ce."documentId"
    `, { limit, userId }); // Pass userId to the query

    const firstFewIds = suggestedComments.slice(0, 5).map(c => c.commentId);
    console.log(`UltraFeedRepo: SQL query returned ${suggestedComments?.length || 0} suggested comments`);
    console.log(`UltraFeedRepo: First few comment IDs and timestamps:`, suggestedComments.slice(0, 5).map(c => ({ id: c.commentId, viewed: c.lastViewed, interacted: c.lastInteracted })));

    return suggestedComments;
  }

  public async getAllCommentThreads(candidates: FeedCommentFromDb[]): Promise<PreDisplayFeedComment[][]> {
    console.log(`UltraFeedRepo.getAllCommentThreads called with ${candidates.length} candidates`);

    // Get unique postIds from all comments
    const uniquePostIds = [...new Set(candidates.map(candidate => candidate.postId))].filter(Boolean);
    //log comments missing postId, give their postIds
    const commentsMissingPostId = candidates.filter(candidate => !candidate.postId);
    console.log(`UltraFeedRepo: ${commentsMissingPostId.length} comments missing postId, their postIds:`, commentsMissingPostId.map(c => c.postId));


    // Group by topLevelCommentId
    const groups: Record<string, FeedCommentFromDb[]> = {};
    for (const candidate of candidates) {
      // Fall back to the comment's own _id if topLevelCommentId is missing
      const topId = candidate.topLevelCommentId ?? candidate.commentId;
      if (!groups[topId]) {
        groups[topId] = [];
      }
      groups[topId].push(candidate);
    }

    // Build a result array of all threads
    const allThreads: PreDisplayFeedComment[][] = [];

    // For each top-level group, compute all linear threads
    for (const [topLevelId, groupCandidates] of Object.entries(groups)) {
      const threads = this.buildDistinctLinearThreads(groupCandidates);

      allThreads.push(...threads);

      // // Convert each linear path of candidates into a FeedCommentThread
      // for (const path of threads) {
      //   // Get the post for this thread
      //   const postId = path[0].postId;
        
      //   if (!postId) {
      //     // eslint-disable-next-line no-console
      //     console.error("UltraFeedRepo.getAllCommentThreads: No post found for thread with topLevelId", { topLevelId, postId });
      //     continue;
      //   }

      //   // Create the FeedCommentThread
      //   allThreads.push({
      //     postId,
      //     commentIds: path.map(c => c.commentId),
      //     topLevelCommentId: topLevelId,
      //   });
      // }
    }

    console.log(`UltraFeedRepo: Generated ${allThreads.length} distinct threads`);
    if (allThreads.length > 0) {
      console.log(`UltraFeedRepo: Sample thread structure:`, 
        JSON.stringify({
          topLevelCommentId: allThreads[0][0].commentId,
          postId: allThreads[0][0].postId,
          commentCount: allThreads[0].length
        }, null, 2));
    } else {
      console.log(`UltraFeedRepo: WARNING - No threads were generated!`);
    }

    return allThreads;
  }

  private buildDistinctLinearThreads(
    candidates: FeedCommentFromDb[]
  ): PreDisplayFeedComment[][] {
    if (!candidates.length) return [];

    // Build a parent->child map
    const children: Record<string, string[]> = {};
    for (const c of candidates) {
      const parent = c.parentCommentId ?? "root";
      if (!children[parent]) {
        children[parent] = [];
      }
      children[parent].push(c.commentId);
    }

    const enhancedCandidates: PreDisplayFeedComment[] = candidates.map(candidate => {
      const parentId = candidate.parentCommentId ?? 'root';
      const siblingCount = children[parentId] ? children[parentId].length - 1 : 0;

      return {
        commentId: candidate.commentId,
        postId: candidate.postId,
        baseScore: candidate.baseScore,
        topLevelCommentId: candidate.topLevelCommentId,
        metaInfo: {
          sources: candidate.sources as FeedItemSourceType[],
          siblingCount,
          lastServed: candidate.lastServed,
          lastViewed: candidate.lastViewed,
          lastInteracted: candidate.lastInteracted,
          postedAt: candidate.postedAt,
        }
      };
    });

    // Index enhanced candidates by their commentId for quick lookups
    const commentsById = new Map<string, PreDisplayFeedComment>(
      enhancedCandidates.map((c) => [c.commentId, c])
    );

    // Identify the "top-level" comment ID from the group
    // Ensure we handle cases where the group might only contain non-top-level comments (find the highest ancestor)
    // For simplicity now, assume the first candidate is representative or is the top-level one.
    // A more robust approach might involve walking up the parent chain if parentCommentId exists.
    const topLevelId = candidates[0].topLevelCommentId ?? candidates[0].commentId;

    // Recursively build all linear threads starting at topLevelId
    const buildCommentThreads = (currentId: string): PreDisplayFeedCommentThread[] => {
      const currentCandidate = commentsById.get(currentId);
      if (!currentCandidate) return [];

      const childIds = children[currentId] || [];
      if (!childIds.length) {
        return [[currentCandidate]]; // Leaf node
      }

      const results: PreDisplayFeedCommentThread[] = [];
      for (const cid of childIds) {
        const subPaths = buildCommentThreads(cid);
        for (const subPath of subPaths) {
          // Check if currentCandidate is already defined before spreading
           if (currentCandidate) {
               results.push([currentCandidate, ...subPath]);
           } else {
               console.warn(`buildCommentThreads: currentCandidate undefined for id ${currentId}. Skipping thread.`);
           }
        }
      }
      // If a node has children, but none lead to valid paths (e.g., missing commentsById), return empty
      // Or, potentially return [[currentCandidate]] if we want to include nodes even if children are missing?
      // Let's return results, which might be empty if subPaths were empty.
      return results;
    };

    // Check if the identified topLevelId actually exists in our map
     if (!commentsById.has(topLevelId)) {
         console.warn(`buildDistinctLinearThreads: Top level comment ${topLevelId} not found in candidates map. Thread group might be incomplete or invalid.`);
         return []; // Cannot build threads if the starting point is missing
     }

    return buildCommentThreads(topLevelId);
  }

  // Updated method using the new helpers
  public async getUltraFeedCommentThreads(context: ResolverContext, limit = 20): Promise<FeedCommentsThread[]> {

    const candidates = await this.getCommentsForFeed(context, 500);
    const threads = await this.getAllCommentThreads(candidates);
    const prioritizedThreadInfos = prioritizeThreads(threads);
    
    if (prioritizedThreadInfos.length > 0) {
      console.log(`UltraFeedRepo: Top 5 reasons:`, prioritizedThreadInfos.slice(0, 5).map(t => t.reason));
    }

    const displayThreads = prioritizedThreadInfos
      .slice(0, limit * 2)
      .map(info => prepareCommentThreadForResolver(info))
      .filter(thread => thread.comments.length > 0);

    console.log(`UltraFeedRepo: Generated ${displayThreads.length} display threads`);

    const finalResult = displayThreads.slice(0, limit);
    
    return finalResult;
  }

  /**
   * Fetches random spotlight items for UltraFeed
   */
  public async getUltraFeedSpotlights(
    context: ResolverContext, 
    limit = 5, 
    servedSpotlightIds: Set<string> = new Set()
  ): Promise<FeedSpotlight[]> {
    console.log(`UltraFeedRepo.getUltraFeedSpotlights called with limit=${limit}`);

    const db = this.getRawDb();
    const servedSpotlightIdsArray = Array.from(servedSpotlightIds); // Convert set to array once
    
    // Query for random spotlight IDs, excluding those already served
    const spotlightRows = await db.manyOrNone(`
      -- UltraFeedRepo.getUltraFeedSpotlights
      SELECT _id 
      FROM "Spotlights"
      WHERE "draft" IS NOT TRUE
      AND "deletedDraft" IS NOT TRUE
      -- Conditionally exclude served spotlights
      ${servedSpotlightIdsArray.length ? 'AND _id NOT IN ($(servedSpotlightIdsArray:csv))' : '-- No served spotlights to exclude'}
      ORDER BY RANDOM()
      LIMIT $(limit)
    `, { limit, servedSpotlightIdsArray });
    
    // If no results, return empty array
    if (!spotlightRows || !spotlightRows.length) {
      return [];
    }
    
    // Extract IDs
    const spotlightItems = spotlightRows.map(row => {
      return {
        spotlightId: row._id,
      }
    });

    console.log("spotlightIds", spotlightItems, Array.isArray(spotlightItems));
    
    if (!spotlightItems.length) {
      console.log(`UltraFeedRepo: No spotlight IDs to query`);
      return [];
    }
    
    console.log(`UltraFeedRepo: Fetched ${spotlightItems.length} spotlight items`);

    return spotlightItems;
  }
}

recordPerfMetrics(UltraFeedRepo);

export default UltraFeedRepo;

