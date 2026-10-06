import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import AutomatedContentEvaluations from "../collections/automatedContentEvaluations/collection";

class AutomatedContentEvaluationsRepo extends AbstractRepo<"AutomatedContentEvaluations"> {
  constructor() {
    super(AutomatedContentEvaluations);
  }

  async getLatestEvaluationsForPosts(postIds: string[]): Promise<(DbAutomatedContentEvaluation | null)[]> {
    const rows = await this.getRawDb().any<DbAutomatedContentEvaluation & { postId: string }>(`
      -- AutomatedContentEvaluationsRepo.getLatestEvaluationsForPosts
      SELECT DISTINCT ON (r."documentId") r."documentId" AS "postId", ace.*
      FROM "Revisions" r
      JOIN "AutomatedContentEvaluations" ace ON ace."revisionId" = r._id
      WHERE r."documentId" = ANY($1::text[]) AND r."fieldName" = 'contents'
      ORDER BY r."documentId", ace."createdAt" DESC
    `, [postIds]);
    const evaluationsByPostId = new Map(rows.map((row) => [row.postId, row]));
    return postIds.map((postId) => evaluationsByPostId.get(postId) ?? null);
  }

  /**
   * Latest revisions of published posts and comments that publishing would have
   * run an automated content evaluation on, but that have no evaluation on any
   * revision, and that no moderator has acted on yet. A moderator approving,
   * snoozing or banning the author sets `reviewedAt`, so content written before
   * then is excluded.
   */
  async getUnevaluatedRevisionsAwaitingReview(
    publishedAfter: Date,
    publishedBefore: Date,
    limit: number,
  ): Promise<DbRevision[]> {
    return await this.getRawDb().any<DbRevision>(`
      -- AutomatedContentEvaluationsRepo.getUnevaluatedRevisionsAwaitingReview
      WITH candidates AS (
        SELECT r.*
        FROM "Posts" p
        JOIN "Revisions" r ON r._id = p."contents_latest"
        JOIN "Users" u ON u._id = p."userId"
        WHERE p."postedAt" > $(publishedAfter) AND p."postedAt" <= $(publishedBefore)
          AND p."draft" IS NOT TRUE
          AND p."rejected" IS NOT TRUE
          AND p."isEvent" IS NOT TRUE
          AND p."shortform" IS NOT TRUE
          AND p."reviewedByUserId" IS NULL
          AND (u."reviewedAt" IS NULL OR u."reviewedAt" < r."editedAt")
        UNION ALL
        SELECT r.*
        FROM "Comments" c
        JOIN "Revisions" r ON r._id = c."contents_latest"
        JOIN "Users" u ON u._id = c."userId"
        WHERE c."postedAt" > $(publishedAfter) AND c."postedAt" <= $(publishedBefore)
          AND c."draft" IS NOT TRUE
          AND c."rejected" IS NOT TRUE
          AND c."deleted" IS NOT TRUE
          AND u."reviewedByUserId" IS NULL
          AND (u."reviewedAt" IS NULL OR u."reviewedAt" < r."editedAt")
      )
      SELECT candidates.*
      FROM candidates
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Revisions" r
        JOIN "AutomatedContentEvaluations" ace ON ace."revisionId" = r._id
        WHERE r."documentId" = candidates."documentId" AND r."fieldName" = 'contents'
      )
      LIMIT $(limit)
    `, { publishedAfter, publishedBefore, limit });
  }
}

recordPerfMetrics(AutomatedContentEvaluationsRepo);

export default AutomatedContentEvaluationsRepo;
