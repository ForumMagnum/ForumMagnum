import AbstractRepo from "./AbstractRepo";
import PostEmbeddings from "../../lib/collections/postEmbeddings/collection";
import { randomId } from "../../lib/random";
import { recordPerfMetrics } from "./perfMetricWrapper";

class PostEmbeddingsRepo extends AbstractRepo<"PostEmbeddings"> {
  constructor() {
    super(PostEmbeddings);
  }

  setPostEmbeddings(
    postId: string,
    postHash: string,
    model: string,
    embeddings: number[],
  ): Promise<null> {
    if (!Array.isArray(embeddings) || embeddings.length < 1) {
      throw new Error("Cannot create post embeddings with empty array");
    }
    const now = new Date();
    return this.none(`
      -- PostEmbeddingsRepo.setPostEmbeddings
      INSERT INTO "PostEmbeddings" (
        "_id",
        "postId",
        "postHash",
        "lastGeneratedAt",
        "embeddings",
        "model",
        "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $4
      ) ON CONFLICT ("postId", "model") DO UPDATE SET
        "postHash" = $3,
        "lastGeneratedAt" = $4,
        "embeddings" = $5
    `, [randomId(), postId, postHash, now, JSON.stringify(embeddings), model]);
  }

  getNearestPostsWeightedByQuality(
    inputEmbedding: number[],
    limit = 10,
  ): Promise<DbPost[]> {
      return this.getRawDb().any(`
        -- PostEmbeddingsRepo.getNearestPostsWeightedByQuality
        WITH embedding_distances AS (
          SELECT
            pe."postId", 
            pe.embeddings <#> $(inputEmbedding) AS distance
          FROM public."PostEmbeddings" pe
          ORDER BY distance
          LIMIT 200 
        )
        SELECT
          p.*
        FROM embedding_distances ed
        LEFT JOIN "Posts" p ON p._id = ed."postId"
        JOIN "Users" u ON p."userId" = u._id
        WHERE draft IS FALSE
        AND p."baseScore" > 0
        ORDER BY (0.5 * (1 / (distance + 0.1)) + 0.5 * log(p."baseScore"))
        LIMIT $(limit)
      `, { inputEmbedding, limit });
  }

}


recordPerfMetrics(PostEmbeddingsRepo);

export default PostEmbeddingsRepo;
