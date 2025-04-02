/**
 * Repository for UltraFeed operations
 * 
 * Contains methods for retrieving, filtering, and organizing comment threads 
 * for the UltraFeed system.
 */

import { FeedCommentFromDb, FeedCommentMetaInfo, FeedItemSourceType, FeedPostWithComments, FeedSpotlight, PreDisplayFeedComment, PreDisplayFeedCommentThread, FeedItemDisplayStatus } from '../../components/ultraFeed/ultraFeedTypes';
import Comments from '../../server/collections/comments/collection';
import AbstractRepo from '../../server/repos/AbstractRepo';
import { recordPerfMetrics } from '../../server/repos/perfMetricWrapper';
import { fragmentTextForQuery } from '../vulcan-lib/fragments';
import { filterNonnull } from '../utils/typeGuardUtils';

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
  ): Promise<FeedPostWithComments[]> {
    console.log(`UltraFeedRepo: getUltraFeedPostThreads called. Limit: ${limit}. Already served post IDs:`, Array.from(servedPostIds)); // Log served IDs

    // Move the dependency outside the module scope to avoid circular dependencies
    // This is a pattern used elsewhere in the codebase
    const { runQuery } = await import('@/server/vulcan-lib/query');
    const gql = await import('graphql-tag').then(module => module.default);
    
    // Use the same approach as RecombeePostsList but from the server side
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
    
    // Pass servedPostIds directly into the query settings
    const variables = {
      limit,
      settings: {
        hybridScenarios: { fixed: 'forum-classic', configurable: 'recombee-lesswrong-custom' },
        excludedPostIds: Array.from(servedPostIds) // Pass exclusions here
      }
    };
    
    let displayPosts: FeedPostWithComments[] = []; // Initialize displayPosts array

    try {
      // Dynamic import of runQuery avoids the circular dependency
      const result = await runQuery(GET_RECOMBEE_HYBRID_POSTS, variables, context);
      let recommendedData = result.data?.RecombeeHybridPosts?.results || [];

      console.log(`UltraFeedRepo: Received ${recommendedData.length} posts from Recombee. IDs:`, recommendedData.map((item: any) => item.post?._id)); // Log initial Recombee results

      // --- Filter Recombee results based on servedPostIds ---
      // Re-add post-query filtering as a safety measure, in case the resolver doesn't handle settings.excludedPostIds
      const initialRecombeeCount = recommendedData.length;
      recommendedData = recommendedData.filter((item: any) => {
         const postId = item.post?._id;
         if (!postId) return false; // Filter out items without post ID
         if (servedPostIds.has(postId)) {
             console.log(`UltraFeedRepo: Filtering served post ${postId} from Recombee results.`);
             return false;
         }
         return true;
      });
      if (initialRecombeeCount !== recommendedData.length) {
          console.log(`UltraFeedRepo: Filtered ${initialRecombeeCount - recommendedData.length} served posts (post-query). ${recommendedData.length} remain.`);
      }
      console.log(`UltraFeedRepo: Posts remaining after filtering served IDs from Recombee:`, recommendedData.map((item: any) => item.post?._id)); // Log filtered Recombee results
      // --- End Filter ---

      displayPosts = recommendedData.map((item: any) => {
        console.log(`UltraFeedRepo: Mapping Recombee post ${item.post?._id} with scenario: ${item.scenario}`); // Log scenario mapping
        return {
          postId: item.post._id,
          comments: [],
          postMetaInfo: {
            sources: [item.scenario as FeedItemSourceType],
            displayStatus: 'expanded' as FeedItemDisplayStatus,
            recommInfo: {
              recommId: item.recommId,
              scenario: item.scenario,
              generatedAt: item.generatedAt ? new Date(item.generatedAt) : null,
            },
          },
        };
      });

      // If we don't have enough recommended posts, supplement with recent posts
      if (displayPosts.length < limit) {
        console.log(`UltraFeedRepo: Not enough posts from Recombee (${displayPosts.length}/${limit}), fetching fallback posts.`);
        const remainingLimit = limit - displayPosts.length;
        const db = this.getRawDb();
        
        const existingPostIds = displayPosts
          .map(post => post.postId)
          .filter((id): id is string => id !== undefined);
        
        // --- Combine IDs to exclude ---
        const allExcludedPostIds = [
            ...existingPostIds, 
            ...Array.from(servedPostIds) 
        ];
        console.log(`UltraFeedRepo: Fallback SQL excluding IDs:`, allExcludedPostIds); // Log IDs excluded in fallback
        // --- ---
        
        const recentPosts = await db.manyOrNone(`
          -- UltraFeedRepo.getRecentPosts (Fallback Supplement)
          SELECT _id as "postId"
          FROM "Posts"
          WHERE "postedAt" > NOW() - INTERVAL '30 days'
          AND "draft" IS NOT TRUE
          AND "isFuture" IS NOT TRUE
          AND "rejected" IS NOT TRUE
          AND "baseScore" > 10
          ${allExcludedPostIds.length ? 'AND _id NOT IN ($(allExcludedPostIds:csv))' : '-- No posts to exclude'}
          ORDER BY "postedAt" DESC
          LIMIT $(limit)
        `, {
          allExcludedPostIds, 
          limit: remainingLimit,
        });

        console.log(`UltraFeedRepo: Fetched ${recentPosts.length} posts from fallback SQL. IDs:`, recentPosts.map((item: any) => item.postId)); // Log fallback results
        
        // Add recent posts to the result
        displayPosts.push(...recentPosts.map((item: any) => {
          console.log(`UltraFeedRepo: Mapping fallback post ${item.postId}`); // Log mapping fallback
          return {
            postId: item.postId,
            comments: [],
            postMetaInfo: {
              sources: ['postThreads' as FeedItemSourceType], // Mark as coming from fallback
              displayStatus: 'expanded' as FeedItemDisplayStatus
            },
          };
        }));
      }

      console.log(`UltraFeedRepo: Combined posts before deduplication (${displayPosts.length} total). IDs:`, displayPosts.map(p => p.postId)); // Log combined list before dedupe

      // --- Add Deduplication Step ---
      // Ensure uniqueness *after* merging Recombee and fallback results
      const uniquePostIds = new Set<string>();
      const finalDisplayPosts: FeedPostWithComments[] = [];
      for (const post of displayPosts) {
          if (post.postId && !uniquePostIds.has(post.postId)) {
              uniquePostIds.add(post.postId);
              finalDisplayPosts.push(post);
          } else if (post.postId && uniquePostIds.has(post.postId)) {
              console.log(`UltraFeedRepo: Deduplicating post ${post.postId}.`); // Log deduplication action
          }
      }
      console.log(`UltraFeedRepo: Returning ${finalDisplayPosts.length} unique posts after deduplication. Final IDs:`, finalDisplayPosts.map(p => p.postId)); // Log final list
      return finalDisplayPosts;
      // --- End Deduplication ---

    } catch (error) {
      console.error("Error in getUltraFeedPostThreads:", error);
      
      // Fallback to direct DB query if Recombee query fails
      const db = this.getRawDb();
      const servedPostIdsArray = Array.from(servedPostIds); // Convert set to array once
      console.log(`UltraFeedRepo: Recombee failed, running full fallback query excluding served IDs:`, servedPostIdsArray); // Log fallback served IDs
      const recentPosts = await db.manyOrNone(`
        -- UltraFeedRepo.getRecentPosts (Full Fallback)
        SELECT _id as "postId"
        FROM "Posts"
        WHERE "postedAt" > NOW() - INTERVAL '30 days'
        AND "draft" IS NOT TRUE
        AND "isFuture" IS NOT TRUE
        AND "rejected" IS NOT TRUE
        AND "baseScore" > 10
        ${servedPostIdsArray.length ? 'AND _id NOT IN ($(servedPostIdsArray:csv))' : '-- No served posts to exclude'}
        ORDER BY "postedAt" DESC
        LIMIT $(limit)
      `, { limit, servedPostIdsArray });
      
      console.log(`UltraFeedRepo: Full fallback query returned ${recentPosts.length} posts. IDs:`, recentPosts.map((item: any) => item.postId)); // Log full fallback results

      // No deduplication needed here as it's a single source
      return recentPosts.map((item: any) => ({
        postId: item.postId,
        comments: [],
        postMetaInfo: {
          sources: ['postThreads' as FeedItemSourceType], // Mark as coming from fallback
          displayStatus: 'expanded' as FeedItemDisplayStatus
        },
      }));
    }
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
    
    // Group threads by topLevelCommentId (first comment's ID in the thread)
    const threadsByTopLevelId = new Map<string, typeof threadsWithStats[0][]>();
    
    for (const threadWithStats of threadsWithStats) {
      const topLevelCommentId = threadWithStats.thread[0]?.commentId;
      if (topLevelCommentId) {
        if (!threadsByTopLevelId.has(topLevelCommentId)) {
          threadsByTopLevelId.set(topLevelCommentId, []);
        }
        threadsByTopLevelId.get(topLevelCommentId)!.push(threadWithStats);
      }
    }
    
    // For each group, keep only the thread with the highest priority score
    const filteredThreads: typeof threadsWithStats = [];
    
    for (const [_, threads] of threadsByTopLevelId) {
      // Find the thread with the highest priority score in this group
      const highestPriorityThread = threads.reduce((highest, current) => 
        current.priorityScore > highest.priorityScore ? current : highest, 
        threads[0]
      );
      
      filteredThreads.push(highestPriorityThread);
    }
    
    // Sort by priority score in descending order
    return filteredThreads.sort((a, b) => b.priorityScore - a.priorityScore);
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
      // Determine display status for this comment
      const displayStatus = expandedIndices.has(index) ? 'expanded' : 'collapsed';
      
      // Randomly decide if expanded comments should be highlighted (50% chance)
      // NOTE: Only expanded comments can be highlighted
      const highlight = displayStatus === 'expanded' ? Math.random() >= 0.5 : false;
      
      acc[comment.commentId] = {
        sources: comment.metaInfo?.sources || [],
        displayStatus: displayStatus,
        alreadySeen: null,
        siblingCount: comment.metaInfo?.siblingCount ?? null,
        highlight: highlight,
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

