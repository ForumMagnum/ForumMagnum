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
}

recordPerfMetrics(AutomatedContentEvaluationsRepo);

export default AutomatedContentEvaluationsRepo;
