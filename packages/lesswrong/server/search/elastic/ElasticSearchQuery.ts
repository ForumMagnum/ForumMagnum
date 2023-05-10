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

  private compileRanking({field, order, scoring}: Ranking): string {
    let expr: string;
    switch (scoring.type) {
    case "numeric":
      expr = `saturation(Math.max(0, doc['${field}'].value), ${scoring.pivot}L)`;
      break;
    case "date":
      const start = new Date("2014-06-01T01:00:00Z");
      const delta = Date.now() - start.getTime();
      const dayRange = Math.ceil(delta / (1000 * 60 * 60 * 24));
      expr = `1 - decayDateLinear('${start.toISOString()}', '${dayRange}d', '0', 0.5, doc['${field}'].value)`;
      break;
    }
    expr = `(doc['${field}'].size() == 0 ? 0 : ${expr})`;
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
          fragment_size: 120,
          no_match_size: 120,
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
          {_score: {order: "desc"}},
          {[config.tiebreaker]: {order: "desc"}},
        ],
      },
    };
  }
}

export default ElasticSearchQuery;
