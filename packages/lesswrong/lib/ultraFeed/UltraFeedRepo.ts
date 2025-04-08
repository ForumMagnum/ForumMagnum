import { FeedCommentFromDb, FeedItemSourceType, FeedSpotlight, PreDisplayFeedComment, PreDisplayFeedCommentThread, FeedItemDisplayStatus, FeedFullPost, FeedPostMetaInfo, FeedCommentsThread } from '../../components/ultraFeed/ultraFeedTypes';
import Comments from '../../server/collections/comments/collection';
import AbstractRepo from '../../server/repos/AbstractRepo';
import { recordPerfMetrics } from '../../server/repos/perfMetricWrapper';

import { prioritizeThreads, prepareCommentThreadForResolver  } from './ultraFeedThreadHelpers';

// Import necessary recombee types and functions
import { recombeeApi, recombeeRequestHelpers } from '../../server/recombee/client';
import { HybridRecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';

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

    const { currentUser } = context;
    const recombeeUser = recombeeRequestHelpers.getRecombeeUser(context);
    let displayPosts: FeedFullPost[] = [];

    if (!recombeeUser) {
      // eslint-disable-next-line no-console
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
  //TODO: figure out exact threshold / date window (make parameter?), perhaps make a window that's adjusted based on user's visit frequency


  async getCommentsForFeed(context: ResolverContext, maxTotalComments = 1000): Promise<FeedCommentFromDb[]> {
    const db = this.getRawDb();
    const userId = context.userId;
    const initialCandidateLimit = 100; // Limit for the first pass

    // Universal status filter applied to ALL comments considered
    const UNIVERSAL_COMMENT_FILTER_CLAUSE = `
      c.deleted IS NOT TRUE
      AND c.retracted IS NOT TRUE
      AND c."authorIsUnreviewed" IS NOT TRUE
      AND c."postId" IS NOT NULL
    `;

    // Specific date filter ONLY for initial candidates
    const CANDIDATE_DATE_FILTER_CLAUSE = `
      c."postedAt" > NOW() - INTERVAL '90 days'
    `;

    const suggestedComments: FeedCommentFromDb[] = await db.manyOrNone(`
      -- UltraFeedRepo.getCommentsForFeed (New Logic: Filter Candidates Early)
      WITH
      "CommentEvents" AS (
        -- Fetch event timestamps for the user (can potentially be limited later if needed)
        SELECT
          "documentId",
          MAX(CASE WHEN "eventType" = 'served' THEN "createdAt" END) AS "lastServed",
          MAX(CASE WHEN "eventType" = 'viewed' THEN "createdAt" END) AS "lastViewed",
          MAX(CASE WHEN "eventType" = 'expanded' THEN "createdAt" END) AS "lastInteracted"
        FROM "UltraFeedEvents"
        WHERE "userId" = $(userId)
          AND "collectionName" = 'Comments'
          AND "eventType" IN ('served', 'viewed', 'expanded')
        GROUP BY "documentId"
      ),
      "InitialCandidates" AS (
        -- Find initial popular/quicktake comments using UNIVERSAL + DATE filters
        -- Apply initial limit here
        SELECT
          c._id AS "commentId",
          COALESCE(c."topLevelCommentId", c._id) AS "threadTopLevelId",
          c."postId",
          -- Keep sources simple for now, can add later if needed for filtering
          CASE WHEN c."baseScore" > 20 THEN ARRAY['topComments'] ELSE ARRAY['quickTake'] END AS sources
        FROM "Comments" c
        WHERE (c."baseScore" > 20 OR c.shortform IS TRUE) -- Potential candidates
          AND ${UNIVERSAL_COMMENT_FILTER_CLAUSE}       -- Apply universal status filter
          AND ${CANDIDATE_DATE_FILTER_CLAUSE}          -- Apply specific date filter
        -- ORDER BY relevance? postedAt? baseScore? Needed for deterministic LIMIT
        ORDER BY c."postedAt" DESC -- Order by recency for the limit
        LIMIT $(initialCandidateLimit)
      ),
      "CandidatesWithEvents" AS (
        -- Join initial candidates with their events
        SELECT
          ic."commentId",
          ic."threadTopLevelId",
          ic."postId",
          ic.sources,
          ce."lastServed",
          ce."lastViewed",
          ce."lastInteracted"
        FROM "InitialCandidates" ic
        LEFT JOIN "CommentEvents" ce ON ic."commentId" = ce."documentId"
      ),
      "FilteredUnseenCandidates" AS (
        -- Filter candidates: Keep only those NOT viewed or interacted with
        SELECT
          "commentId",
          "threadTopLevelId",
          "postId",
          sources
        FROM "CandidatesWithEvents"
        WHERE "lastViewed" IS NULL AND "lastInteracted" IS NULL -- Filter condition
      ),
      "RelevantThreads" AS (
        -- Get the distinct top-level IDs from the FILTERED candidates
        SELECT DISTINCT "threadTopLevelId" FROM "FilteredUnseenCandidates"
      ),
      "ValidTopLevelComments" AS (
        -- Check validity of top-level comments for relevant threads (Universal filter only)
        SELECT
          c._id AS "topLevelCommentId"
        FROM "Comments" c
        WHERE c._id IN (SELECT "threadTopLevelId" FROM "RelevantThreads")
          AND ${UNIVERSAL_COMMENT_FILTER_CLAUSE}
      ),
      "AllCommentsForValidThreads" AS (
        -- Fetch ALL valid comments (universal filter) belonging to threads
        -- whose top-level comment is valid
        SELECT
          c._id AS "commentId",
          COALESCE(c."topLevelCommentId", c._id) AS "threadTopLevelId",
          c."parentCommentId",
          c."postId",
          c."baseScore",
          c."postedAt"
        FROM "Comments" c
        WHERE (
                c."topLevelCommentId" IN (SELECT "topLevelCommentId" FROM "ValidTopLevelComments")
                OR (c."topLevelCommentId" IS NULL AND c._id IN (SELECT "topLevelCommentId" FROM "ValidTopLevelComments"))
              )
          AND ${UNIVERSAL_COMMENT_FILTER_CLAUSE}
      ),
       "CandidateSourcesMap" AS (
         -- Map sources back, using original InitialCandidates before filtering
         -- We might want to show source even if it wasn't the trigger for thread inclusion
         SELECT
           "commentId",
           sources
         FROM "InitialCandidates"
      )
      -- Final SELECT: Join all valid comments with events and sources
      SELECT
        ac."commentId",
        ac."threadTopLevelId" AS "topLevelCommentId",
        ac."parentCommentId",
        ac."postId",
        ac."baseScore",
        ac."postedAt",
        COALESCE(csm.sources, ARRAY[]::TEXT[]) AS "sources", -- Map sources
        ce."lastServed",
        ce."lastViewed",
        ce."lastInteracted"
      FROM "AllCommentsForValidThreads" ac
      LEFT JOIN "CommentEvents" ce ON ac."commentId" = ce."documentId" -- Need events for prioritization
      LEFT JOIN "CandidateSourcesMap" csm ON ac."commentId" = csm."commentId" -- Map sources
      ORDER BY ac."threadTopLevelId", ac."postedAt"
      LIMIT $(maxTotalComments) -- Apply high limit to the final result set
    `, { userId, initialCandidateLimit, maxTotalComments }); // Pass parameters

    console.log(`UltraFeedRepo: Filtered candidate query returned ${suggestedComments?.length || 0} comments (max ${maxTotalComments})`);

    return suggestedComments;
  }

  public async getAllCommentThreads(candidates: FeedCommentFromDb[]): Promise<PreDisplayFeedComment[][]> {
    console.log(`UltraFeedRepo.getAllCommentThreads called with ${candidates.length} candidates`);

    const groups: Record<string, FeedCommentFromDb[]> = {};
    for (const candidate of candidates) {
      // Fall back to the comment's own _id if topLevelCommentId is missing
      const topId = candidate.topLevelCommentId ?? candidate.commentId;
      if (!groups[topId]) {
        groups[topId] = [];
      }
      groups[topId].push(candidate);
    }

    const allThreads: PreDisplayFeedComment[][] = [];

    // For each top-level group, compute all linear threads
    for (const [topLevelId, groupCandidates] of Object.entries(groups)) {
      const threads = this.buildDistinctLinearThreads(groupCandidates);

      allThreads.push(...threads);

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
    const displayThreads = prioritizedThreadInfos
      .slice(0, limit * 2)
      .map(info => prepareCommentThreadForResolver(info))
      .filter(thread => thread.comments.length > 0);

    const finalResult = displayThreads.slice(0, limit);
    
    return finalResult;
  }

  public async getUltraFeedSpotlights(
    context: ResolverContext, 
    limit = 5, 
    servedSpotlightIds: Set<string> = new Set()
  ): Promise<FeedSpotlight[]> {
    console.log(`UltraFeedRepo.getUltraFeedSpotlights called with limit=${limit}`);

    const db = this.getRawDb();
    const servedSpotlightIdsArray = Array.from(servedSpotlightIds);
    
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
    
    if (!spotlightRows || !spotlightRows.length) {
      return [];
    }
    
    const spotlightItems = spotlightRows.map(row => {
      return {
        spotlightId: row._id,
      }
    });

    if (!spotlightItems.length) {
      // eslint-disable-next-line no-console
      console.log(`UltraFeedRepo: No spotlight IDs to query`);
      return [];
    }
    
    return spotlightItems;
  }
}

recordPerfMetrics(UltraFeedRepo);

export default UltraFeedRepo;

