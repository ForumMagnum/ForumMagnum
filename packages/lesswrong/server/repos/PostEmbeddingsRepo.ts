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

export interface AiDigestNearestNeighborOptions {
  minKarma: number;
  publishedBefore?: Date | null;
  publishedAfter?: Date | null;
  limit: number;
  excludePostIds?: string[];
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

  private aiDigestPostIdsByEmbeddingDistanceSelector = `
    SELECT
      p._id,
      p.title,
      ed.distance AS raw_distance,
      (0.5 * (1 / (distance + 0.1)) + 0.5 * log(p."baseScore")) AS quality_adjusted_score
    FROM embedding_distances ed
    LEFT JOIN "Posts" p ON p._id = ed."postId"
    WHERE ${getViewablePostsSelector('p')}
    AND p."baseScore" >= $(minKarma)
    AND ($(publishedAfter)::timestamptz IS NULL OR p."postedAt" >= $(publishedAfter))
    AND ($(publishedBefore)::timestamptz IS NULL OR p."postedAt" < $(publishedBefore))
    AND (
      CARDINALITY($(excludePostIds)::text[]) = 0
      OR p."_id" <> ALL($(excludePostIds)::text[])
    )
    ORDER BY (0.8 * (1 / (distance + 0.1)) + 0.2 * log(p."baseScore")) DESC
    LIMIT $(limit)
  `;

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

  async getAiDigestNearestPostIdsWeightedByQuality(
    inputEmbedding: number[],
    options: AiDigestNearestNeighborOptions,
  ): Promise<string[]> {
    const results = await this.getRawDb().any<PostEmbeddingDistanceInfo>(`
      -- PostEmbeddingsRepo.getAiDigestNearestPostIdsWeightedByQuality
      WITH embedding_distances AS (
        SELECT
          pe."postId",
          pe.embeddings <#> $(inputEmbedding)::VECTOR(1536) AS distance
        FROM public."PostEmbeddings" pe
        ORDER BY distance
        LIMIT 200
      )
      ${this.aiDigestPostIdsByEmbeddingDistanceSelector}
    `, {
      inputEmbedding,
      minKarma: options.minKarma,
      publishedAfter: options.publishedAfter ?? null,
      publishedBefore: options.publishedBefore ?? null,
      excludePostIds: options.excludePostIds ?? [],
      limit: options.limit,
    });

    return results.map(({ _id }) => _id);
  }
}

recordPerfMetrics(PostEmbeddingsRepo);

export default PostEmbeddingsRepo;
