import AbstractRepo from "./AbstractRepo";
import CommentEmbeddings from "../../lib/collections/commentEmbeddings/collection";
import { randomId } from "../../lib/random";
import { recordPerfMetrics } from "./perfMetricWrapper";

class CommentEmbeddingsRepo extends AbstractRepo<"CommentEmbeddings"> {
  constructor() {
    super(CommentEmbeddings);
  }

  setCommentEmbeddings(
    commentId: string,
    commentHash: string,
    model: string,
    embeddings: number[],
  ): Promise<null> {
    if (!Array.isArray(embeddings) || embeddings.length < 1) {
      throw new Error("Cannot create comment embeddings with empty array");
    }
    const now = new Date();
    return this.none(`
      -- CommentEmbeddingsRepo.setCommentEmbeddings
      INSERT INTO "CommentEmbeddings" (
        "_id",
        "commentId",
        "commentHash",
        "lastGeneratedAt",
        "embeddings",
        "model",
        "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $4
      ) ON CONFLICT ("commentId", "model") DO UPDATE SET
        "commentHash" = $3,
        "lastGeneratedAt" = $4,
        "embeddings" = $5
    `, [randomId(), commentId, commentHash, now, JSON.stringify(embeddings), model]);
  }

  async getCommentIdsWithoutEmbeddings(createdAtCutoff?: Date): Promise<string[]> {
    const results = await this.getRawDb().any<{ _id: string }>(`
      SELECT c."_id"
      FROM "Comments" c
      LEFT JOIN "CommentEmbeddings" ce ON c."_id" = ce."commentId"
      WHERE ce."embeddings" IS NULL
      AND COALESCE((c.contents ->> 'wordCount')::INTEGER, 0) > 0
      AND c.deleted IS FALSE
      AND c."deletedPublic" IS FALSE
      ${createdAtCutoff ? `AND c."createdAt" > $1` : ''}
      ORDER BY c."createdAt" ASC
      LIMIT 100
    `, [createdAtCutoff]);

    return results.map(({ _id }) => _id);
  }

  searchCommentsByEmbedding(searchEmbeddings: number[], settings: { scoreBias: number }): Promise<DbComment[]> {
    const { scoreBias } = settings;

    return this.getRawDb().any<DbComment>(`
      WITH embedding_distances AS (
        SELECT
          ce."commentId",
          1 - (ce.embeddings <=> $(searchEmbeddings)::VECTOR(1024)) AS distance
        FROM "CommentEmbeddings" ce
        ORDER BY distance DESC
        -- LIMIT 100
      ), normalized_scores AS (
        SELECT 
          ed."commentId",
          ed.distance,
          -- Normalize distance to 0-1 (smaller is better)
          (ed.distance + 1) / 2 as normalized_distance,
          -- Normalize score using log scale (larger is better)
          -- Comment karma range is roughly from -100 to 400
          -- Add 100 to shift range to 1-500 for log
          -- Then normalize by log(500) to get 0-1 range
          GREATEST(LEAST(
            LN(c."baseScore" + 100) / LN(500),
            1
          ), 0) as normalized_score
        FROM embedding_distances ed
        JOIN "Comments" c
        ON c."_id" = ed."commentId"
      ), combined_scores AS (
        SELECT 
          "commentId",
          distance,
          -- Combine scores using bias parameter
          (normalized_score * $(scoreBias)) + (
            (normalized_distance) * (1 - $(scoreBias))
          ) as combined_score
        FROM normalized_scores  
      )
      SELECT c.*
      FROM "Comments" c
      JOIN combined_scores cs
      ON c."_id" = cs."commentId"
      ORDER BY cs.combined_score DESC
      LIMIT 20;
    `, { searchEmbeddings, scoreBias });
  }
}

recordPerfMetrics(CommentEmbeddingsRepo);

export default CommentEmbeddingsRepo;

