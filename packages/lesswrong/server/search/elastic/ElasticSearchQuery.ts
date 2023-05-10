import type { SearchRequest as SearchRequestInfo } from "@elastic/elasticsearch/lib/api/types";
import type { SearchRequest as SearchRequestBody } from "@elastic/elasticsearch/lib/api/typesWithBodyKey";
import { AlgoliaIndexCollectionName } from "../../../lib/search/algoliaUtil";
import { elasticSearchConfig, Ranking } from "./ElasticSearchConfig";

export type QueryData = {
  index: string,
  search: string
  offset?: number,
  limit?: number,
  preTag?: string,
  postTag?: string,
}

class ElasticSearchQuery {
  constructor(
    private queryData: QueryData,
  ) {}

  private indexToCollectionName(index: string): AlgoliaIndexCollectionName {
    const data: Record<string, AlgoliaIndexCollectionName> = {
      comments: "Comments",
      posts: "Posts",
      users: "Users",
      sequences: "Sequences",
      tags: "Tags",
    };
    if (!data[index]) {
      throw new Error("Invalid index name: " + index);
    }
    return data[index];
  }

  private compileRanking({field, order, pivot}: Ranking): string {
    const expr = `saturation(Math.max(0, doc['${field}'].value), ${pivot})`;
    return order === "asc" ? `(1 - ${expr})` : expr;
  }

  private compiileScoreExpression(rankings?: Ranking[]): string {
    let expr = "_score";
    for (const ranking of rankings ?? []) {
      expr += " * " + this.compileRanking(ranking);
    }
    return expr;
  }

  compile(): SearchRequestInfo | SearchRequestBody {
    const {index, search, offset = 0, limit = 10, preTag, postTag} = this.queryData;
    const collectionName = this.indexToCollectionName(index);
    const config = elasticSearchConfig[collectionName];
    if (!config) {
      throw new Error("Config not found for index " + index);
    }
    const tags = {
      pre_tags: [preTag ?? "<em>"],
      post_tags: [postTag ?? "</em>"],
    };
    return {
      index,
      from: offset,
      size: limit,
      body: {
        track_scores: true,
        track_total_hits: true,
        highlight: {
          fields: {
            [config.snippet]: tags,
            ...(config.highlight && {[config.highlight]: tags}),
          },
        },
        query: {
          script_score: {
            query: {
              bool: {
                must: {
                  bool: {
                    should: [
                      {
                        multi_match: {
                          query: search,
                          fields: config.fields,
                          fuzziness: "AUTO",
                        },
                      },
                    ],
                  },
                },
                should: [],
              },
            },
            script: {
              source: this.compiileScoreExpression(config.ranking),
            },
          },
        },
        sort: [
          {
            _score: {
              order: "desc",
            },
          },
        ],
      },
    };
  }
}

export default ElasticSearchQuery;
