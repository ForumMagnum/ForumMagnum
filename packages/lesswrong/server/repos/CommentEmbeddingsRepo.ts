import AbstractRepo from "./AbstractRepo";
import CommentEmbeddings from "@/server/collections/commentEmbeddings/collection";
import { randomId } from "@/lib/random";
import { recordPerfMetrics } from "./perfMetricWrapper";

class CommentEmbeddingsRepo extends AbstractRepo<"CommentEmbeddings"> {
  constructor() {
    super(CommentEmbeddings);
  }

  setCommentEmbeddings(
    commentId: string,
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
        "lastGeneratedAt",
        "embeddings",
        "model",
        "createdAt"
      ) VALUES (
        $(_id), $(commentId), $(lastGeneratedAt), $(embeddings), $(model), $(createdAt)
      ) ON CONFLICT ("commentId", "model") DO UPDATE SET
        "lastGeneratedAt" = $(lastGeneratedAt),
        "embeddings" = $(embeddings)
    `, {
      _id: randomId(),
      commentId,
      lastGeneratedAt: now,
      embeddings: JSON.stringify(embeddings),
      model,
      createdAt: now,
    });
  }

  async getAllCommentIdsWithoutEmbeddings(postedAtCutoff?: Date): Promise<{ _id: string, postedAt: Date }[]> {
    const results = await this.getRawDb().any<{ _id: string, postedAt: Date }>(`
      SELECT c."_id", c."postedAt"
      FROM "Comments" c
      WHERE NOT EXISTS (
          SELECT 1 FROM "CommentEmbeddings" ce 
          WHERE ce."commentId" = c."_id"
      )
      AND c.deleted IS FALSE
      AND c."deletedPublic" IS FALSE  
      AND c.rejected IS FALSE
      ${postedAtCutoff ? `AND c."postedAt" > $1` : ''}
      ORDER BY c."postedAt" ASC
    `, [postedAtCutoff]);

    return results.map(({ _id, postedAt }) => ({ _id, postedAt }));
  }

  async getCommentIdsWithoutEmbeddings(postedAtCutoff?: Date, limit = 100): Promise<string[]> {
    const results = await this.getRawDb().any<{ _id: string }>(`
      SELECT c."_id"
      FROM "Comments" c
      LEFT JOIN "CommentEmbeddings" ce ON c."_id" = ce."commentId"
      WHERE ce."embeddings" IS NULL
      AND COALESCE((c.contents ->> 'wordCount')::INTEGER, 0) > 0
      AND c.deleted IS FALSE
      AND c."deletedPublic" IS FALSE
      ${postedAtCutoff ? `AND c."postedAt" > $1` : ''}
      ORDER BY c."postedAt" ASC
      LIMIT $2
    `, [postedAtCutoff, limit]);

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
        WHERE ce.embeddings <> $(searchEmbeddings)::VECTOR(1024)
        ORDER BY ce.embeddings <=> $(searchEmbeddings)::VECTOR(1024)
        LIMIT 1000
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
