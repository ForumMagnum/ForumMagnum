/**
 * Repository for UltraFeed operations
 * 
 * Contains methods for retrieving, filtering, and organizing comment threads 
 * for the UltraFeed system.
 */

import { randomId } from '../random';
import { FeedCommentCandidate, FeedCommentItemDisplay, FeedCommentThread } from '../../components/ultraFeed/ultraFeedTypes';
import Comments from '../../server/collections/comments/collection';
import AbstractRepo from '../../server/repos/AbstractRepo';
import { recordPerfMetrics } from '../../server/repos/perfMetricWrapper';
import groupBy from 'lodash/groupBy';
import { fetchFragment } from '@/server/fetchFragment';


type FeedCommentThreadWithoutServingId = Omit<FeedCommentThread, 'servingId'>;

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


  //TODO: add comments on threads you've partificipated in/interacted with, especially replies to you
  //TODO: filter based on previous interactions with comments?
  //TODO: figure out exact threshold / date window (make parameter?), perhaps make a window that's adjusted based on user's visit frequency

  async getCommentsForFeed(limit = 1000): Promise<FeedCommentCandidate[]> {
    const db = this.getRawDb();

    // Factor out the filter clause for more clarity
    const FEED_COMMENT_FILTER_CLAUSE = `
    c."postedAt" > NOW() - INTERVAL '180 days'
    AND c.deleted IS NOT TRUE
    AND c.deletedPublic IS NOT TRUE
    AND c.retracted IS NOT TRUE
    AND c."authorIsUnreviewed" IS NOT TRUE
    `;

    const suggestedComments = await db.manyOrNone(`
      -- UltraFeedRepo.getCommentsForFeed
      WITH
      "popularComments" AS (
        SELECT
          c._id AS "commentId",
          c."topLevelCommentId",
          c."postId",
          'topComment' AS source
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
          sub."postId",
          ARRAY_AGG(sub.source) AS sources
        FROM (
          SELECT * FROM popularComments
          UNION
          SELECT * FROM quickTakes
        ) sub
        GROUP BY sub."commentId", sub."topLevelCommentId", sub."postId"
      ),
      "otherComments"  AS (
        SELECT
          c._id,
          c."topLevelCommentId",
          c."postId",
          ARRAY[]::TEXT[] AS sources
        FROM "Comments" c
        WHERE (
          c."topLevelCommentId" IN (SELECT "topLevelCommentId" FROM allSuggestedComments)
          OR c._id IN (SELECT "topLevelCommentId" FROM allSuggestedComments)
        )
          AND ${FEED_COMMENT_FILTER_CLAUSE}
          AND c._id NOT IN (SELECT _id FROM allSuggestedComments)
      )
      SELECT _id, "sources" FROM allSuggestedComments
      UNION
      SELECT _id, "sources" FROM otherComments
    `, { limit });

    const comments = await fetchFragment({
      collectionName: "Comments",
      fragmentName: "FeedCommentItemFragment",
      selector: { _id: { $in: suggestedComments.map((c) => c._id) } },
      currentUser: null,
    });

    // Merge comment data with source information
    const commentsWithSources = comments.map((c) => ({
      comment: {...c, topLevelCommentId: c.topLevelCommentId ?? c._id},
      sources: suggestedComments.find((c2) => c2._id === c._id)?.sources || [],
    }));

    return commentsWithSources;
  }

  public getAllCommentThreads(candidates: FeedCommentCandidate[]): FeedCommentThreadWithoutServingId[] {
    // Group by topLevelCommentId
    const groups: Record<string, FeedCommentCandidate[]> = {};
    for (const candidate of candidates) {
      // Fall back to the comment's own _id if topLevelCommentId is missing
      const topId = candidate.comment.topLevelCommentId ?? candidate.comment._id;
      if (!groups[topId]) {
        groups[topId] = [];
      }
      groups[topId].push(candidate);
    }

    // Build a result array of all threads
    const allThreads: FeedCommentThreadWithoutServingId[] = [];

    // For each top-level group, compute all linear threads
    for (const [topLevelId, groupCandidates] of Object.entries(groups)) {
      const threads = this.buildDistinctLinearThreads(groupCandidates);

      // Convert each linear path of candidates into a FeedCommentThread
      for (const path of threads) {
        // Use the first comment's "post" as the post for the entire thread
        // (assuming they all share the same post)
        const post = path[0].comment.post
        
        if (!post) {
          // eslint-disable-next-line no-console
          console.error("UltraFeedRepo.getAllCommentThreads: No post found for thread with topLevelId", { topLevelId });
          continue;
        }

        // Create the FeedCommentThread
        allThreads.push({
          post,
          comments: path, // Use the candidates directly
          topLevelCommentId: topLevelId,
        });
      }
    }

    return allThreads;
  }

  private buildDistinctLinearThreads(
    candidates: FeedCommentCandidate[]
  ): FeedCommentCandidate[][] {
    if (!candidates.length) return [];

    // Index candidates by their commentId for quick lookups
    const commentsById = new Map<string, FeedCommentCandidate>(
      candidates.map((c) => [c.comment._id, c])
    );

    // Build a parent->child map
    const children: Record<string, string[]> = {};
    for (const c of candidates) {
      const parent = c.comment.parentCommentId ?? "root";
      if (!children[parent]) {
        children[parent] = [];
      }
      children[parent].push(c.comment._id);
    }

    // Identify the "top-level" comment ID from the group
    const topLevelId = candidates[0].comment.topLevelCommentId ?? candidates[0].comment._id;

    // Recursively build all linear threads starting at topLevelId
    const buildCommentThreads = (currentId: string): FeedCommentCandidate[][] => {
      const currentCandidate = commentsById.get(currentId);
      if (!currentCandidate) return [];

      const childIds = children[currentId] || [];
      // If no children, this is a leaf
      if (!childIds.length) {
        return [[currentCandidate]];
      }

      // For each child, collect all subpaths
      const results: FeedCommentCandidate[][] = [];
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

  public getThreadStatistics(thread: FeedCommentThread | FeedCommentThreadWithoutServingId): ThreadStatistics {
    // Handle edge case of empty threads
    if (!thread.comments || thread.comments.length === 0) {
      return {
        commentCount: 0,
        maxKarma: 0,
        sumKarma: 0,
        sumKarmaSquared: 0,
        averageKarma: 0,
        averageTop3Comments: 0
      };
    }

    const commentCount = thread.comments.length;
    const karmaValues = thread.comments.map(comment => comment.comment.baseScore || 0);
    const maxKarma = Math.max(...karmaValues);
    const sumKarma = karmaValues.reduce((sum, score) => sum + score, 0);
    const sumKarmaSquared = karmaValues.reduce((sum, score) => sum + (score * score), 0);
    const averageTop3Comments = karmaValues.slice(0, 3).reduce((sum, score) => sum + score, 0) / 3;
    
    const averageKarma = sumKarma / commentCount;

    return {
      commentCount: thread.comments.length,
      maxKarma,
      sumKarma,
      sumKarmaSquared,
      averageKarma,
      averageTop3Comments
    };
  }

  public prioritizeThreads(threads: FeedCommentThread[] | FeedCommentThreadWithoutServingId[]): Array<{
    thread: FeedCommentThread | FeedCommentThreadWithoutServingId;
    stats: ThreadStatistics;
    priorityScore: number;
  }> {
    // Calculate statistics for each thread
    const threadsWithStats = threads.map(thread => {
      const stats = this.getThreadStatistics(thread);
      
      // Calculate a combined priority score - adjust this formula as needed
      // Current formula emphasizes high karma and adequate comment count
      const priorityScore = stats.sumKarmaSquared;
      
      return {
        thread,
        stats,
        priorityScore
      };
    });
    
    // Sort by priority score in descending order
    return threadsWithStats.sort((a, b) => b.priorityScore - a.priorityScore);
  }


  // end-to-end function for generating threads for displaying in the UltraFeed
  public async getUltraFeedCommentThreads(limit = 20): Promise<FeedCommentThreadWithoutServingId[]> {
    const candidates = await this.getCommentsForFeed(1000); // limit of how many comments to consider
    const threads = this.getAllCommentThreads(candidates);
    const prioritizedThreads = this.prioritizeThreads(threads);
    return prioritizedThreads.slice(0, limit).map((t: {thread: FeedCommentThreadWithoutServingId}) => t.thread);
  }
}

recordPerfMetrics(UltraFeedRepo);

export default UltraFeedRepo;
