import AbstractRepo from "./AbstractRepo";
import AutomatedContentEvaluations from "../collections/automatedContentEvaluations/collection";
import { getViewablePostsSelector } from "./helpers";

export interface AIDetectionComparisonItemRaw {
  documentId: string;
  collectionName: "Posts" | "Comments";
  title: string | null;
  htmlPreview: string;
  postedAt: Date;
  baseScore: number;
  authorDisplayName: string | null;
  authorSlug: string | null;
  rejected: boolean;
  aceId: string | null;
  aceScore: number | null;
  aceSentenceScores: { sentence: string; score: number }[] | null;
  aceAiChoice: string | null;
  aceAiReasoning: string | null;
  aceAiCoT: string | null;
  acePangramScore: number | null;
  acePangramMaxScore: number | null;
  acePangramPrediction: string | null;
  acePangramWindowScores: { text: string; score: number; startIndex: number; endIndex: number }[] | null;
}

class AutomatedContentEvaluationsRepo extends AbstractRepo<"AutomatedContentEvaluations"> {
  constructor() {
    super(AutomatedContentEvaluations);
  }

  /**
   * Get posts/comments for the AI detection comparison page.
   * Returns content matching either:
   * - Borderline: Sapling score > 0.2, not rejected, AND author has been reviewed
   * - Rejected: rejected with Sapling score between 0.5 and 0.8
   */
  async getComparisonItems(
    limit: number = 50,
    offset: number = 0
  ): Promise<AIDetectionComparisonItemRaw[]> {
    const combinedQuery = `
      -- AutomatedContentEvaluationsRepo.getComparisonItems
      WITH posts_data AS (
        SELECT
          p."_id" AS "documentId",
          'Posts' AS "collectionName",
          p."title" AS "title",
          COALESCE(LEFT(r."html", 500), '') AS "htmlPreview",
          p."postedAt" AS "postedAt",
          COALESCE(p."baseScore", 0) AS "baseScore",
          u."displayName" AS "authorDisplayName",
          u."slug" AS "authorSlug",
          COALESCE(p."rejected", false) AS "rejected",
          ace."_id" AS "aceId",
          ace."score" AS "aceScore",
          ace."sentenceScores" AS "aceSentenceScores",
          ace."aiChoice" AS "aceAiChoice",
          ace."aiReasoning" AS "aceAiReasoning",
          ace."aiCoT" AS "aceAiCoT",
          ace."pangramScore" AS "acePangramScore",
          ace."pangramMaxScore" AS "acePangramMaxScore",
          ace."pangramPrediction" AS "acePangramPrediction",
          ace."pangramWindowScores" AS "acePangramWindowScores"
        FROM "Posts" p
        LEFT JOIN "Revisions" r ON r."_id" = p."contents_latest"
        LEFT JOIN "AutomatedContentEvaluations" ace ON ace."revisionId" = r."_id"
        LEFT JOIN "Users" u ON u."_id" = p."userId"
        WHERE ${getViewablePostsSelector("p")}
          AND ace."_id" IS NOT NULL
          AND ace."score" IS NOT NULL
          AND (
            -- Borderline: score > 0.2, not rejected, author has been reviewed
            (ace."score" > 0.2 AND COALESCE(p."rejected", false) = false AND u."reviewedByUserId" IS NOT NULL)
            -- OR Rejected: score between 0.5 and 0.8
            -- OR (p."rejected" = true AND ace."score" >= 0.5 AND ace."score" <= 0.8)
          )
      ),
      comments_data AS (
        SELECT
          c."_id" AS "documentId",
          'Comments' AS "collectionName",
          NULL AS "title",
          COALESCE(LEFT(r."html", 500), '') AS "htmlPreview",
          c."postedAt" AS "postedAt",
          COALESCE(c."baseScore", 0) AS "baseScore",
          u."displayName" AS "authorDisplayName",
          u."slug" AS "authorSlug",
          COALESCE(c."rejected", false) AS "rejected",
          ace."_id" AS "aceId",
          ace."score" AS "aceScore",
          ace."sentenceScores" AS "aceSentenceScores",
          ace."aiChoice" AS "aceAiChoice",
          ace."aiReasoning" AS "aceAiReasoning",
          ace."aiCoT" AS "aceAiCoT",
          ace."pangramScore" AS "acePangramScore",
          ace."pangramMaxScore" AS "acePangramMaxScore",
          ace."pangramPrediction" AS "acePangramPrediction",
          ace."pangramWindowScores" AS "acePangramWindowScores"
        FROM "Comments" c
        LEFT JOIN "Revisions" r ON r."_id" = c."contents_latest"
        LEFT JOIN "AutomatedContentEvaluations" ace ON ace."revisionId" = r."_id"
        LEFT JOIN "Users" u ON u."_id" = c."userId"
        WHERE c."deleted" IS NOT TRUE
          AND ace."_id" IS NOT NULL
          AND ace."score" IS NOT NULL
          AND (
            -- Borderline: score > 0.2, not rejected, author has been reviewed
            (ace."score" > 0.2 AND COALESCE(c."rejected", false) = false AND u."reviewedByUserId" IS NOT NULL)
            -- OR Rejected: score between 0.5 and 0.8
            -- OR (c."rejected" = true AND ace."score" >= 0.5 AND ace."score" <= 0.8)
          )
      ),
      combined AS (
        SELECT * FROM posts_data
        UNION ALL
        SELECT * FROM comments_data
      )
      SELECT * FROM combined
      ORDER BY "postedAt" DESC
      LIMIT $(limit)
      OFFSET $(offset)
    `;

    return this.getRawDb().any(combinedQuery, { limit, offset });
  }
}

export default AutomatedContentEvaluationsRepo;
