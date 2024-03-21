// import { RecommendationFeatureName } from "../collections/users/recommendationSettings";
import type { TiktokenModel } from "@dqbd/tiktoken";

export const DEFAULT_EMBEDDINGS_MODEL: TiktokenModel = "text-embedding-ada-002";

abstract class Feature {
  getJoin(): string {
    return "";
  }

  getFilter(): string {
    return "";
  }

  getScore(): string {
    return "";
  }

  getArgs(): Record<string, unknown> {
    return {};
  }
}

abstract class ContextualFeature extends Feature {
  private readonly contextual = true;
  constructor() {
    super();
  }
}

type ConstructableFeature = {
  new(): Feature;
}

class KarmaFeature extends Feature {
  private readonly pivot = 100;

  getScore() {
    return `
      CASE WHEN p."baseScore" > 0
        THEN p."baseScore" / (${this.pivot} + p."baseScore")
        ELSE 0
      END
    `;
  }
}

class CuratedFeature extends Feature {
  getScore() {
    return `CASE WHEN p."curatedDate" IS NULL THEN 0 ELSE 1 END`;
  }
}

class TagSimilarityFeature extends ContextualFeature {
  getScore() {
    return `fm_post_tag_similarity($(postId), p."_id")`;
  }
}

class CollabFilterFeature extends ContextualFeature {
  getJoin() {
    return `INNER JOIN "UniquePostUpvoters" rec ON rec."postId" = p."_id"`;
  }

  getScore() {
    const srcVoters = `(
      SELECT voters
      FROM "UniquePostUpvoters"
      WHERE "postId" = $(postId)
    )`;
    return `
      COALESCE(
        (# (${srcVoters} & rec.voters))::FLOAT /
          NULLIF((# (${srcVoters} | rec.voters))::FLOAT, 0),
        0
      )
    `;
  }
}

class TextSimilarityFeature extends ContextualFeature {
  constructor(
    private model = DEFAULT_EMBEDDINGS_MODEL,
  ) {
    super();
  }

  getJoin() {
    return `
      INNER JOIN "PostEmbeddings" pe ON
        pe."postId" = p."_id" AND
        pe."model" = $(embeddingsModel)
      JOIN "PostEmbeddings" seed_embeddings ON
        seed_embeddings."postId" = $(postId) AND
        seed_embeddings."model" = $(embeddingsModel)
    `;
  }

  getScore() {
    return `(-1 * (pe."embeddings" <#> seed_embeddings."embeddings"))`;
  }

  getArgs() {
    return {
      embeddingsModel: this.model,
    };
  }
}

export { ContextualFeature };

export const featureRegistry = {
  karma: KarmaFeature,
  curated: CuratedFeature,
  tagSimilarity: TagSimilarityFeature,
  collabFilter: CollabFilterFeature,
  textSimilarity: TextSimilarityFeature,
};
