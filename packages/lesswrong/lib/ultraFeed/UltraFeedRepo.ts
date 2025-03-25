/**
 * Repository for UltraFeed operations
 * 
 * Contains methods for retrieving, filtering, and organizing comment threads 
 * for the UltraFeed system.
 */

import { FeedCommentFromDb, FeedCommentMetaInfo, FeedItemSourceType, FeedPostWithComments, FeedSpotlight, PreDisplayFeedComment, PreDisplayFeedCommentThread } from '../../components/ultraFeed/ultraFeedTypes';
import Comments from '../../server/collections/comments/collection';
import AbstractRepo from '../../server/repos/AbstractRepo';
import { recordPerfMetrics } from '../../server/repos/perfMetricWrapper';
import { runQuery } from '@/server/vulcan-lib/query';
import gql from 'graphql-tag';
import { fragmentTextForQuery } from '../vulcan-lib/fragments';

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

  public async getUltraFeedPostThreads(context: ResolverContext, limit = 20): Promise<FeedPostWithComments[]> {

    // RECOMBEE HYBRID POSTS: LATEST + RECOMMENDED
    // TODO: separate these out so can be selected independently
    const GET_RECOMBEE_HYBRID_POSTS = gql`
      query getRecombeeHybridPosts($limit: Int, $settings: JSON) {
        RecombeeHybridPosts(limit: $limit, settings: $settings) {
          results {
            post {
              _id
            }
            scenario
            recommId
            generatedAt
          }
        }
      }
    `;
    
    const variables = {
      limit,
      settings: {
        hybridScenarios: { fixed: 'forum-classic', configurable: 'recombee-lesswrong-custom' }
      }
    };
    const result = await runQuery(GET_RECOMBEE_HYBRID_POSTS, variables, context);

    const recommendedData = result.data?.RecombeeHybridPosts?.results || [];

    // 4. Convert each post result into DisplayFeedPostWithComments
    //    so each item has a "post" and an empty "comments" array by default
    const displayPosts: FeedPostWithComments[] = recommendedData.map((item: any) => ({
      postId: item.post._id,
      comments: [],              // We leave comments empty, or retrieve them separately if desired.
      postMetaInfo: {
        sources: [item.scenario],
        displayStatus: 'expanded',
        recommInfo: {
          recommId: item.recommId,
          scenario: item.scenario,
          generatedAt: item.generatedAt ? new Date(item.generatedAt) : null,
        },
      },
    }));

    // TODO: Get posts based on your subscriptions

    return displayPosts;
  }


  //TODO: add comments on threads you've partificipated in/interacted with, especially replies to you
  //TODO: filter based on previous interactions with comments?
  //TODO: figure out exact threshold / date window (make parameter?), perhaps make a window that's adjusted based on user's visit frequency


  async getCommentsForFeed(context: ResolverContext, limit = 200): Promise<FeedCommentFromDb[]> {
    const db = this.getRawDb();

    console.log(`UltraFeedRepo.getCommentsForFeed called with limit=${limit}`);

    // Factor out the filter clause for more clarity
    const FEED_COMMENT_FILTER_CLAUSE = `
    c."postedAt" > NOW() - INTERVAL '180 days'
    AND c.deleted IS NOT TRUE
    AND c.retracted IS NOT TRUE
    AND c."authorIsUnreviewed" IS NOT TRUE
    AND "postId" IS NOT NULL
    `;

    const suggestedComments: FeedCommentFromDb[] = await db.manyOrNone(`
      -- UltraFeedRepo.getCommentsForFeed
      WITH
      "popularComments" AS (
        SELECT
          c._id AS "commentId",
          c."topLevelCommentId",
          c."postId",
          c."parentCommentId",
          c."baseScore",
          'topComments' AS source
        FROM "Comments" c
        WHERE ${FEED_COMMENT_FILTER_CLAUSE}
          AND c."baseScore" > 20
        ORDER BY c."baseScore" DESC
        LIMIT $(limit)
      ),
      "quickTakes" AS (
        SELECT
          c._id AS "commentId",
          c."topLevelCommentId",
          c."postId",
          c."parentCommentId",
          c."baseScore",
          'quickTake' AS source
        FROM "Comments" c
        WHERE ${FEED_COMMENT_FILTER_CLAUSE}
          AND c.shortform IS TRUE
        ORDER BY c."postedAt" DESC
        LIMIT $(limit)
      ),
      "allSuggestedComments" AS (
        SELECT
          sub."commentId" AS _id,
          sub."topLevelCommentId",
          sub."parentCommentId",
          sub."baseScore",
          sub."postId",
          ARRAY_AGG(sub.source) AS sources
        FROM (
          SELECT * FROM "popularComments"
          UNION
          SELECT * FROM "quickTakes"
        ) sub
        GROUP BY sub."commentId", sub."topLevelCommentId", sub."postId", sub."parentCommentId", sub."baseScore"
      ),
      "otherComments"  AS (
        SELECT
          c._id,
          c."topLevelCommentId",
          c."parentCommentId",
          c."baseScore",
          c."postId",
          ARRAY[]::TEXT[] AS sources
        FROM "Comments" c
        WHERE (
          c."topLevelCommentId" IN (SELECT "topLevelCommentId" FROM "allSuggestedComments")
          OR c._id IN (SELECT "topLevelCommentId" FROM "allSuggestedComments")
        )
          AND ${FEED_COMMENT_FILTER_CLAUSE}
          AND c._id NOT IN (SELECT _id FROM "allSuggestedComments")
      )
      SELECT _id AS "commentId", "topLevelCommentId", "parentCommentId", "postId", "baseScore", "sources" FROM "allSuggestedComments"
      UNION
      SELECT _id AS "commentId", "topLevelCommentId", "parentCommentId", "postId", "baseScore", "sources" FROM "otherComments"
    `, { limit });

    const firstFewIds = suggestedComments.slice(0, 5).map(c => c.commentId);
    console.log(`UltraFeedRepo: SQL query returned ${suggestedComments?.length || 0} suggested comments`);
    console.log(`UltraFeedRepo: First few comment IDs:`, firstFewIds);
    console.log(`UltraFeedRepo: After merging with sources, have ${suggestedComments.length} comments`);

    
    // // Merge comment data with source information
    // const commentsWithSources = suggestedComments.map((c: FeedCommentFromDb) => ({
    //   // TODO: figure out ideal fix for __typename stuff, is causing issues in useNotifyMe within Actions Menu on ufCommentItems
    //   commentId: c._id,
    //   postId: c.postId,
    //   metaInfo: { sources: c.sources as FeedItemSourceType[] }
    // }));

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

    // Build a parent->child map to track siblings
    const children: Record<string, string[]> = {};
    for (const c of candidates) {
      const parent = c.parentCommentId ?? "root";
      if (!children[parent]) {
        children[parent] = [];
      }
      children[parent].push(c.commentId);
    }

    const enhancedCandidates: PreDisplayFeedComment[] = candidates.map(candidate => {
      
      const parentId = candidate.parentCommentId;
      const siblingCount = children[parentId] ? children[parentId].length - 1 : 0;
      
      // Create new object instead of mutating the original
      return {
        commentId: candidate.commentId,
        postId: candidate.postId,
        baseScore: candidate.baseScore,
        metaInfo: {
          sources: candidate.sources as FeedItemSourceType[],
          siblingCount,
          alreadySeen: null,
        }
      };
    });
    
    // Index enhanced candidates by their commentId for quick lookups
    const commentsById = new Map<string, PreDisplayFeedComment>(
      enhancedCandidates.map((c) => [c.commentId, c])
    );

    // Identify the "top-level" comment ID from the group
    const topLevelId = candidates[0].topLevelCommentId ?? candidates[0].commentId;

    // Recursively build all linear threads starting at topLevelId
    const buildCommentThreads = (currentId: string): PreDisplayFeedCommentThread[] => {
      const currentCandidate = commentsById.get(currentId);
      if (!currentCandidate) return [];

      const childIds = children[currentId] || [];
      // If no children, this is a leaf
      if (!childIds.length) {
        return [[currentCandidate]];
      }

      // For each child, collect all subpaths
      const results: PreDisplayFeedCommentThread[] = [];
      for (const cid of childIds) {
        const subPaths = buildCommentThreads(cid);
        for (const subPath of subPaths) {
          results.push([currentCandidate, ...subPath]);
        }
      }
      return results;
    };

    return buildCommentThreads(topLevelId);
  }

  public getThreadStatistics(thread: PreDisplayFeedCommentThread): ThreadStatistics {
    // Handle edge case of empty threads
    if (!thread.length || thread.length === 0) {
      return {
        commentCount: 0,
        maxKarma: 0,
        sumKarma: 0,
        sumKarmaSquared: 0,
        averageKarma: 0,
        averageTop3Comments: 0
      };
    }

    const commentCount = thread.length;
    const karmaValues = thread.map(comment => comment.baseScore || 0);
    const maxKarma = Math.max(...karmaValues);
    const sumKarma = karmaValues.reduce((sum, score) => sum + score, 0);
    const sumKarmaSquared = karmaValues.reduce((sum, score) => sum + (score * score), 0);
    const averageTop3Comments = karmaValues.slice(0, 3).reduce((sum, score) => sum + score, 0) / 3;
    
    const averageKarma = sumKarma / commentCount;

    return {
      commentCount,
      maxKarma,
      sumKarma,
      sumKarmaSquared,
      averageKarma,
      averageTop3Comments
    };
  }

  public prioritizeThreads(threads: PreDisplayFeedCommentThread[]): Array<{
    thread: PreDisplayFeedCommentThread;
    stats: ThreadStatistics;
    priorityScore: number;
  }> {
    // Calculate statistics for each thread
    const threadsWithStats = threads.map(thread => {
      const stats = this.getThreadStatistics(thread);
      
      // Calculate a combined priority score - adjust this formula as needed
      // Current formula emphasizes high karma and adequate comment count

      // TODO: temporarily add some noise, we'll remove later, noise should be about 10% of the score

      const priorityScore = stats.sumKarmaSquared + (Math.random() * stats.sumKarmaSquared * 0.2);
      
      return {
        thread,
        stats,
        priorityScore
      };
    });
    
    // Sort by priority score in descending order
    return threadsWithStats.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // TOOD: Implement actually good logic for choosing which to display
  public prepareCommentThreadForResolver(thread: PreDisplayFeedCommentThread): FeedPostWithComments {
    const numComments = thread.length;
    // Make sure we don't try to expand more comments than exist
    const numExpanded = Math.min(numComments, numComments <= 7 ? 2 : 3);
    // randomly choose numExpanded indices from numComments
    const expandedIndices = new Set<number>();
    
    // If numExpanded is 0, skip the loop entirely
    if (numExpanded > 0) {
      // Use an attempt counter to prevent infinite loops
      let attempts = 0;
      const maxAttempts = 100;
      
      while (expandedIndices.size < numExpanded && attempts < maxAttempts) {
        attempts++;
        const index = Math.floor(Math.random() * numComments);
        expandedIndices.add(index);
      }
    }

    const commentIds = thread.map((item: PreDisplayFeedComment) => item.commentId);
    const commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo} = thread.reduce((acc: {[commentId: string]: FeedCommentMetaInfo}, comment, index) => {
      acc[comment.commentId] = {
        sources: comment.metaInfo?.sources || [],
        displayStatus: expandedIndices.has(index) ? 'expanded' : 'collapsed',
        alreadySeen: null,
        siblingCount: comment.metaInfo?.siblingCount ?? null,
      };
      return acc;
    }, {});
    
    return {
      postId: thread[0].postId,
      postMetaInfo: { sources: ['commentThreads'], displayStatus: 'hidden' },
      commentIds,
      commentMetaInfos,
    };
  }

  // TODO: somewhere choose threads better
  // end-to-end function for generating threads for displaying in the UltraFeed
  public async getUltraFeedCommentThreads(context: ResolverContext, limit = 20): Promise<FeedPostWithComments[]> {
    console.log(`UltraFeedRepo.getUltraFeedCommentThreads started with limit=${limit}`);
    
    const candidates = await this.getCommentsForFeed(context, 200); // limit of how many comments to consider
    console.log(`UltraFeedRepo: Got ${candidates.length} candidates from getCommentsForFeed`);
    
    const threads = await this.getAllCommentThreads(candidates);
    console.log(`UltraFeedRepo: Got ${threads.length} threads from getAllCommentThreads`);
    
    const prioritizedThreads = this.prioritizeThreads(threads);
    console.log(`UltraFeedRepo: After prioritization, have ${prioritizedThreads.length} threads`);
    
    const displayThreads = prioritizedThreads.map(thread => this.prepareCommentThreadForResolver(thread.thread));
    console.log(`UltraFeedRepo: Generated ${displayThreads.length} display threads`);

    // TODO: IMPORTANT - remove before production
    // filter to only include threads with < 5 comments
    const filteredDisplayThreads = displayThreads.filter(thread => thread.commentIds?.length && thread.commentIds.length < 10);
    
    const result = filteredDisplayThreads.slice(0, limit);
    console.log(`UltraFeedRepo: Returning ${result.length} threads after applying limit`);
    
    return result;
  }

  /**
   * Fetches random spotlight items for UltraFeed
   */
  public async getUltraFeedSpotlights(context: ResolverContext, limit = 5): Promise<FeedSpotlight[]> {
    console.log(`UltraFeedRepo.getUltraFeedSpotlights called with limit=${limit}`);

    // Get database connection
    const db = this.getRawDb();
    
    // Query for random spotlight IDs
    const spotlightRows = await db.manyOrNone(`
      -- UltraFeedRepo.getUltraFeedSpotlights
      SELECT _id 
      FROM "Spotlights"
      WHERE "draft" IS NOT TRUE
      AND "deletedDraft" IS NOT TRUE
      ORDER BY RANDOM()
      LIMIT $(limit)
    `, { limit });
    
    console.log(`UltraFeedRepo: SQL query returned ${spotlightRows?.length || 0} random spotlight IDs`);
    
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

