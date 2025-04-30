import AbstractRepo from "./AbstractRepo";
import PostEmbeddings from "../../server/collections/postEmbeddings/collection";
import { randomId } from "../../lib/random";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { getViewablePostsSelector } from "./helpers";

interface PostEmbeddingDistanceInfo {
  _id: string,
  title: string,
  raw_distance: unknown,
  quality_adjusted_score: unknown
}

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

  private postIdsByEmbeddingDistanceSelector = `
    SELECT
      p._id,
      p.title,
      ed.distance AS raw_distance,
      (0.5 * (1 / (distance + 0.1)) + 0.5 * log(p."baseScore")) AS quality_adjusted_score
    FROM embedding_distances ed
    LEFT JOIN "Posts" p ON p._id = ed."postId"
    WHERE ${getViewablePostsSelector('p')}
    AND p."baseScore" > 0
    ORDER BY (0.8 * (1 / (distance + 0.1)) + 0.2 * log(p."baseScore")) DESC
    LIMIT $(limit)
  `;

  async getNearestPostIdsAndInfoWeightedByQuality(
    inputEmbedding: number[],
    limit = 5,
  ): Promise<{_id: string, raw_distance: number, quality_adjusted_score: number}[]> {
    const results = await this.getRawDb().any<PostEmbeddingDistanceInfo>(`
      -- PostEmbeddingsRepo.getNearestPostsWeightedByQuality
      WITH embedding_distances AS (
        SELECT
          pe."postId", 
          pe.embeddings <#> $(inputEmbedding)::VECTOR(1536) AS distance
        FROM public."PostEmbeddings" pe
        ORDER BY distance
        LIMIT 200 
      )
      ${this.postIdsByEmbeddingDistanceSelector}
    `, { inputEmbedding, limit });
  
    return results.map(({ _id, raw_distance, quality_adjusted_score }) => ({ _id, raw_distance, quality_adjusted_score }));
  }
  
  async getNearestPostIdsAndProductsByPostId(
    postId: string,
    limit = 5
  ): Promise<{_id: string, product: number}[]> {
    const results = await this.getRawDb().any<{_id: string, product: number}>(`
      -- PostEmbeddingsRepo.getNearestPostsByPostId
      WITH source_embedding AS (
        SELECT embeddings
        FROM public."PostEmbeddings"
        WHERE "postId" = $(postId)
      ),
      embedding_products AS (
        SELECT
          pe."postId", 
          pe.embeddings <#> (SELECT embeddings FROM source_embedding) AS product 
        FROM public."PostEmbeddings" pe
        WHERE pe."postId" != $(postId)
        ORDER BY product
        LIMIT $(limit)
      )
      SELECT p._id, -ep.product as product
      FROM embedding_products ep
      LEFT JOIN "Posts" p ON p._id = ep."postId"
      WHERE p."draft" = false
      ORDER BY product
      LIMIT $(limit)
    `, { postId, limit });
  
    return results.map(({ _id, product }) => ({ _id, product }));
  }
  async getNearestPostIdsWeightedByQuality(
    inputEmbedding: number[],
    limit = 5,
  ): Promise<string[]> {
    const results = await this.getRawDb().any<PostEmbeddingDistanceInfo>(`
      -- PostEmbeddingsRepo.getNearestPostsWeightedByQuality
      WITH embedding_distances AS (
        SELECT
          pe."postId", 
          pe.embeddings <#> $(inputEmbedding)::VECTOR(1536) AS distance
        FROM public."PostEmbeddings" pe
        ORDER BY distance
        LIMIT 200 
      )
      ${this.postIdsByEmbeddingDistanceSelector}
    `, { inputEmbedding, limit });

    return results.map(({ _id }) => _id);
  }

  async getNearestPostIdsWeightedByQualityByPostId(
    postId: string,
    limit = 5
  ): Promise<string[]> {
    const results = await this.getRawDb().any<PostEmbeddingDistanceInfo>(`
      -- PostEmbeddingsRepo.getNearestPostsWeightedByQualityByPostId
      WITH source_embedding AS (
        SELECT embeddings
        FROM public."PostEmbeddings"
        WHERE "postId" = $(postId)
      ),
      embedding_distances AS (
        SELECT
          pe."postId", 
          pe.embeddings <#> (SELECT embeddings FROM source_embedding) AS distance
        FROM public."PostEmbeddings" pe
        WHERE pe."postId" != $(postId)
        ORDER BY distance
        LIMIT 200 
      )
      ${this.postIdsByEmbeddingDistanceSelector}
    `, { postId, limit });

    return results.map(({ _id }) => _id);
  }
}

recordPerfMetrics(PostEmbeddingsRepo);

export default PostEmbeddingsRepo;
