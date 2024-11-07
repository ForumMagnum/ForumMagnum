import type {
  SearchRequest as SearchRequestInfo,
} from "@elastic/elasticsearch/lib/api/types";
import type {
  SearchRequest as SearchRequestBody,
} from "@elastic/elasticsearch/lib/api/typesWithBodyKey";
import {
  IndexConfig,
  collectionNameToConfig,
  indexToCollectionName,
} from "./ElasticConfig";
import type { SearchIndexCollectionName } from "@/lib/search/searchUtil";

export type MultiQueryData = {
  indexes: string[],
  search: string,
  offset?: number,
  limit?: number,
}

class ElasticMultiQuery {
  private collectionNames: SearchIndexCollectionName[];
  private configs: IndexConfig[];

  constructor(
    private queryData: MultiQueryData,
  ) {
    this.collectionNames = queryData.indexes.map(indexToCollectionName);
    this.configs = this.collectionNames.map(collectionNameToConfig);
  }

  private getSearchFieldFromConfig(config: IndexConfig): string {
    const field = config.fields[0];
    const caretIndex = field.indexOf("^");
    const fieldName = caretIndex >= 0 ? field.substring(0, caretIndex) : field;
    return `${fieldName}.exact`;
  }

  compile(): SearchRequestInfo | SearchRequestBody {
    const {
      indexes,
      search,
      offset = 0,
      limit = 10,
    } = this.queryData;
    return {
      search_type: "dfs_query_then_fetch",
      index: indexes,
      from: offset,
      size: 0,
      body: {
        track_scores: true,
        track_total_hits: true,
        query: {
          bool: {
            should: indexes.map((indexName, i) => ({
              bool: {
                should: {
                  match_phrase_prefix: {
                    [this.getSearchFieldFromConfig(this.configs[i])]: search,
                  },
                },
                filter: [
                  ...(this.configs[i].filters ?? []),
                  {
                    prefix: {
                      _index: {
                        value: indexName,
                      },
                    },
                  },
                ],
              },
            })),
          },
        },
        aggs: {
          indexes: {
            terms: {
              field: "_index",
              size: 50,
            },
            aggs: {
              hits: {
                top_hits: {
                  "size": limit,
                },
              },
            },
          },
        },
        _source: {
          excludes: [
            "exportedAt",
            ...this.configs.flatMap(({privateFields}) => privateFields),
          ],
        },
      },
    };
  }
}

export default ElasticMultiQuery;
