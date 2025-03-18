/**
 * Repository for UltraFeed operations
 * 
 * Contains methods for retrieving, filtering, and organizing comment threads 
 * for the UltraFeed system.
 */

import { randomId } from '../random';
import { PreDisplayFeedComment, PreDisplayFeedCommentThread, DisplayFeedCommentThread } from '../../components/ultraFeed/ultraFeedTypes';
import Comments from '../../server/collections/comments/collection';
import AbstractRepo from '../../server/repos/AbstractRepo';
import { recordPerfMetrics } from '../../server/repos/perfMetricWrapper';
import groupBy from 'lodash/groupBy';
import { runQuery, createAnonymousContext } from '@/server/vulcan-lib/query';
import gql from 'graphql-tag';


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

  async getCommentsForFeed(limit = 1000): Promise<PreDisplayFeedComment[]> {
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
          SELECT * FROM "popularComments"
          UNION
          SELECT * FROM "quickTakes"
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
          c."topLevelCommentId" IN (SELECT "topLevelCommentId" FROM "allSuggestedComments")
          OR c._id IN (SELECT "topLevelCommentId" FROM "allSuggestedComments")
        )
          AND ${FEED_COMMENT_FILTER_CLAUSE}
          AND c._id NOT IN (SELECT _id FROM "allSuggestedComments")
      )
      SELECT _id, "sources" FROM "allSuggestedComments"
      UNION
      SELECT _id, "sources" FROM "otherComments"
    `, { limit });

    console.log(`UltraFeedRepo: SQL query returned ${suggestedComments?.length || 0} suggested comments`);
    // Safely extract comment IDs for logging
    const firstFewIds = [];
    for (let i = 0; i < Math.min(5, suggestedComments.length); i++) {
      if (suggestedComments[i] && suggestedComments[i]._id) {
        firstFewIds.push(suggestedComments[i]._id);
      }
    }
    console.log(`UltraFeedRepo: First few comment IDs:`, firstFewIds);

    const context = createAnonymousContext();
    
    
    const query = gql`
      query GetFeedComments($commentIds: [String!]!) {
        comments(input: { terms: { view: "allRecentComments", commentIds: $commentIds, limit: 1000 } }) {
          results {
            ...FeedCommentItemFragment
          }
        }
      }
      
      fragment FeedCommentItemFragment on Comment {
        _id
        postId
        topLevelCommentId
        parentCommentId
        contents {
          html
        }
        postedAt
        baseScore
        user {
          _id
          slug
          createdAt
          username
          displayName
          profileImageId
          previousDisplayName
          fullName
          karma
          afKarma
          deleted
          isAdmin
          htmlBio
          jobTitle
          organization
          postCount
          commentCount
          sequenceCount
        }
        post {
          _id
          slug
          title
          draft
          shortform
          hideCommentKarma
          af
          currentUserReviewVote {
            _id
            qualitativeScore
            quadraticScore
          }
          userId
          coauthorStatuses
          hasCoauthorPermission
          rejected
          debate
          collabEditorDialogue
        }
      }
    `;
    
    const result = await runQuery(query, { commentIds: suggestedComments.map(c => c._id) }, context);
    const comments = result.data?.comments?.results || [];

    console.log(`UltraFeedRepo: Preparing to fetch ${suggestedComments.length} comments via GraphQL`);

    console.log(`UltraFeedRepo: GraphQL query returned ${comments?.length || 0} comments`);
    if (comments?.length > 0) {
      console.log(`UltraFeedRepo: First few comment IDs after GraphQL:`, comments.slice(0, 3).map((c: any) => c._id));
      console.log(`UltraFeedRepo: Sample comment data structure:`, JSON.stringify(comments[0], null, 2).substring(0, 500) + '...');
    } else {
      console.log(`UltraFeedRepo: WARNING - No comments returned from GraphQL query!`);
    }

    // Define interfaces for our data structures
    interface CommentResult {
      _id: string;
      topLevelCommentId?: string;
      [key: string]: any;
    }

    interface CommentWithSource {
      _id: string;
      sources?: string[];
    }

    // Merge comment data with source information
    const commentsWithSources = comments.map((c: CommentResult) => ({
      comment: {...c, topLevelCommentId: c.topLevelCommentId ?? c._id},
      metaInfo: { sources: suggestedComments.find((c2: CommentWithSource) => c2._id === c._id /* c from outer scope */)?.sources || [] }
    }));

    console.log(`UltraFeedRepo: After merging with sources, have ${commentsWithSources.length} comments`);

    return commentsWithSources;
  }

  public getAllCommentThreads(candidates: PreDisplayFeedComment[]): PreDisplayFeedCommentThread[] {
    console.log(`UltraFeedRepo.getAllCommentThreads called with ${candidates.length} candidates`);

    // Group by topLevelCommentId
    const groups: Record<string, PreDisplayFeedComment[]> = {};
    for (const candidate of candidates) {
      // Fall back to the comment's own _id if topLevelCommentId is missing
      const topId = candidate.comment.topLevelCommentId ?? candidate.comment._id;
      if (!groups[topId]) {
        groups[topId] = [];
      }
      groups[topId].push(candidate);
    }

    // Build a result array of all threads
    const allThreads: PreDisplayFeedCommentThread[] = [];

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

    console.log(`UltraFeedRepo: Generated ${allThreads.length} distinct threads`);
    if (allThreads.length > 0) {
      console.log(`UltraFeedRepo: Sample thread structure:`, 
        JSON.stringify({
          topLevelCommentId: allThreads[0].topLevelCommentId,
          postId: allThreads[0].post._id,
          commentCount: allThreads[0].comments.length
        }, null, 2));
    } else {
      console.log(`UltraFeedRepo: WARNING - No threads were generated!`);
    }

    return allThreads;
  }

  private buildDistinctLinearThreads(
    candidates: PreDisplayFeedComment[]
  ): PreDisplayFeedComment[][] {
    if (!candidates.length) return [];

    // Build a parent->child map to track siblings
    const children: Record<string, string[]> = {};
    for (const c of candidates) {
      const parent = c.comment.parentCommentId ?? "root";
      if (!children[parent]) {
        children[parent] = [];
      }
      children[parent].push(c.comment._id);
    }

    const enhancedCandidates = candidates.map(candidate => {
      if (!candidate.comment.parentCommentId) {
        return candidate;
      }
      
      const parentId = candidate.comment.parentCommentId;
      const siblingCount = children[parentId] ? children[parentId].length - 1 : 0;
      
      // Create new object instead of mutating the original
      return {
        comment: candidate.comment,
        metaInfo: {
          ...(candidate.metaInfo || {}),
          siblingCount
        }
      };
    });
    
    // Index enhanced candidates by their commentId for quick lookups
    const commentsById = new Map<string, PreDisplayFeedComment>(
      enhancedCandidates.map((c) => [c.comment._id, c])
    );

    // Identify the "top-level" comment ID from the group
    const topLevelId = candidates[0].comment.topLevelCommentId ?? candidates[0].comment._id;

    // Recursively build all linear threads starting at topLevelId
    const buildCommentThreads = (currentId: string): PreDisplayFeedComment[][] => {
      const currentCandidate = commentsById.get(currentId);
      if (!currentCandidate) return [];

      const childIds = children[currentId] || [];
      // If no children, this is a leaf
      if (!childIds.length) {
        return [[currentCandidate]];
      }

      // For each child, collect all subpaths
      const results: PreDisplayFeedComment[][] = [];
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

  // TOOD: Implement actually good logic for choosing which to display
  public prepareCommentThreadForDisplay(thread: PreDisplayFeedCommentThread): DisplayFeedCommentThread {
    const numComments = thread.comments.length;
    const numExpanded = numComments <= 4 ? 1 : 2;
    // randomly choose numExpanded indices from numComments
    const expandedIndices = new Set<number>();
    while (expandedIndices.size < numExpanded) {
        const index = Math.floor(Math.random() * numComments);
        expandedIndices.add(index);
      }
      
      return {
        post: thread.post,
        topLevelCommentId: thread.topLevelCommentId,
        comments: thread.comments.map((item: PreDisplayFeedComment, index: number) => {
          const { comment } = item;
          return {
            commentId: comment._id,
            postId: comment.postId,
            user: comment.user,
            postedAt: comment.postedAt,
            baseScore: comment.baseScore,
            content: comment.contents?.html || '',
            sources: item.metaInfo.sources,
            displayStatus: expandedIndices.has(index) ? 'expanded' : 'collapsed'
          }
        })
    }
  }

  // TODO: somewhere choose threads better
  // end-to-end function for generating threads for displaying in the UltraFeed
  public async getUltraFeedCommentThreads(limit = 20): Promise<DisplayFeedCommentThread[]> {
    console.log(`UltraFeedRepo.getUltraFeedCommentThreads started with limit=${limit}`);
    
    const candidates = await this.getCommentsForFeed(1000); // limit of how many comments to consider
    console.log(`UltraFeedRepo: Got ${candidates.length} candidates from getCommentsForFeed`);
    
    const threads = this.getAllCommentThreads(candidates);
    console.log(`UltraFeedRepo: Got ${threads.length} threads from getAllCommentThreads`);
    
    const prioritizedThreads = this.prioritizeThreads(threads);
    console.log(`UltraFeedRepo: After prioritization, have ${prioritizedThreads.length} threads`);
    
    const displayThreads = prioritizedThreads.map(thread => this.prepareCommentThreadForDisplay(thread.thread));
    console.log(`UltraFeedRepo: Generated ${displayThreads.length} display threads`);
    
    const result = displayThreads.slice(0, limit);
    console.log(`UltraFeedRepo: Returning ${result.length} threads after applying limit`);
    
    return result;
  }
}

recordPerfMetrics(UltraFeedRepo);

export default UltraFeedRepo;
