import type { RecommendationFeatureName } from "@/lib/collections/users/recommendationSettings";
import { embeddingsSettings } from "../embeddings";
import { getDefaultFilterSettings, type FilterSettings } from "@/lib/filterSettings";
import {
  filterModeToAdditiveKarmaModifier,
  filterModeToMultiplicativeKarmaModifier,
  resolveFrontpageFilters,
} from "@/lib/collections/posts/views";

abstract class Feature {
  constructor(protected currentUser: DbUser | null) {}

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
  new(currentUser: DbUser | null): Feature;
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
    currentUser: DbUser | null,
    private model = embeddingsSettings.embeddingModel,
  ) {
    super(currentUser);
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
        (author_subs."documentId" = p."userId" OR
          author_subs."documentId" = ANY(p."coauthorUserIds"))
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

class FrontpageFilterSettingsFeature extends Feature {
  private filterClauses: string[] = [];
  private score: string;
  private args: Record<string, unknown> = {};

  constructor(currentUser: DbUser | null) {
    super(currentUser);

    const filterSettings: FilterSettings = currentUser?.frontpageFilterSettings ??
      getDefaultFilterSettings();
    const {
      tagsRequired,
      tagsExcluded,
      tagsSoftFiltered,
    } = resolveFrontpageFilters(filterSettings);

    let argCount = 0;
    const makeArgName = () => `tagFilter${argCount++}`;

    for (const tag of tagsRequired) {
      const argName = makeArgName();
      this.args[argName] = tag.tagId;
      this.filterClauses.push(
        `COALESCE((p."tagRelevance"->$(${argName}))::INTEGER, 0) >= 1`,
      );
    }
    for (const tag of tagsExcluded) {
      const argName = makeArgName();
      this.args[argName] = tag.tagId;
      this.filterClauses.push(
        `COALESCE((p."tagRelevance"->$(${argName}))::INTEGER, 0) < 1`,
      );
    }

    const addClauses = ["p.\"baseScore\""];
    const multClauses = ["1"];
    for (const tag of tagsSoftFiltered) {
      const argName = makeArgName();
      this.args[argName] = tag.tagId;
      addClauses.push(`(
        CASE
          WHEN COALESCE((p."tagRelevance"->$(${argName}))::INTEGER, 0) > 0
          THEN ${filterModeToAdditiveKarmaModifier(tag.filterMode)}
          ELSE 0
        END
      )`);
      multClauses.push(`(
        CASE
          WHEN COALESCE((p."tagRelevance"->$(${argName}))::INTEGER, 0) > 0
          THEN ${filterModeToMultiplicativeKarmaModifier(tag.filterMode)}
          ELSE 1
        END
      )`);
    }

    switch (filterSettings.personalBlog) {
      case "Hidden":
        this.filterClauses.push(`p."frontpageDate" IS NOT NULL`);
        break;
      case "Required":
        this.filterClauses.push(`p."frontpageDate" IS NULL`);
        break;
      default:
        addClauses.push(`(
          CASE
            WHEN p."frontpageDate" IS NULL
            THEN 0
            ELSE ${filterModeToAdditiveKarmaModifier(filterSettings.personalBlog)}
          END
        )`);
        break;
    }

    this.score = `((${addClauses.join(" + ")}) * ${multClauses.join(" * ")})`;
  }

  getFilter() {
    return this.filterClauses.join(" AND ");
  }

  getScore() {
    return this.score;
  }

  getArgs() {
    return this.args;
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
  frontpageFilterSettings: FrontpageFilterSettingsFeature,
};
