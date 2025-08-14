import { RecommendationFeatureName } from "../../lib/collections/users/recommendationSettings";
import { embeddingsSettings } from "../embeddings";

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

class TagSimilarityFeature extends Feature {
  getScore() {
    return `fm_post_tag_similarity($(postId), p."_id")`;
  }
}

class CollabFilterFeature extends Feature {
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

class TextSimilarityFeature extends Feature {
  constructor(
    private model = embeddingsSettings.embeddingModel,
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

class SubscribedAuthorPostsFeature extends Feature {
  getJoin() {
    return `
      LEFT JOIN "Subscriptions" author_subs ON
        author_subs."collectionName" = 'Users' AND
        author_subs."state" = 'subscribed' AND
        author_subs."deleted" IS NOT TRUE AND
        author_subs."type" = 'newPosts' AND
        author_subs."userId" = $(userId) AND
        author_subs."documentId" = p."userId"
    `;
  }

  getScore() {
    return `(CASE WHEN author_subs."_id" IS NULL THEN 0 ELSE 1 END)`;
  }
}

class SubscribedTagPostsFeature extends Feature {
  getJoin() {
    return `
      LEFT JOIN "Subscriptions" tag_subs ON
        tag_subs."collectionName" = 'Tags' AND
        tag_subs."state" = 'subscribed' AND
        tag_subs."deleted" IS NOT TRUE AND
        tag_subs."type" = 'newTagPosts' AND
        tag_subs."userId" = $(userId) AND
        (p."tagRelevance"->tag_subs."documentId")::INTEGER >= 1
    `;
  }

  getScore() {
    return `(CASE WHEN tag_subs."_id" IS NULL THEN 0 ELSE 1 END)`;
  }
}

export const featureRegistry: Record<
  RecommendationFeatureName,
  ConstructableFeature
> = {
  karma: KarmaFeature,
  curated: CuratedFeature,
  tagSimilarity: TagSimilarityFeature,
  collabFilter: CollabFilterFeature,
  textSimilarity: TextSimilarityFeature,
  subscribedAuthorPosts: SubscribedAuthorPostsFeature,
  subscribedTagPosts: SubscribedTagPostsFeature,
};
