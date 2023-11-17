import type {
  QueryDslQueryContainer,
  SearchRequest as SearchRequestInfo,
  Sort,
} from "@elastic/elasticsearch/lib/api/types";
import type {
  SearchRequest as SearchRequestBody,
} from "@elastic/elasticsearch/lib/api/typesWithBodyKey";
import { indexNameToConfig, IndexConfig, Ranking } from "./ElasticConfig";
import { parseQuery, QueryToken } from "./parseQuery";
import { searchOriginDate } from "./elasticSettings";

/**
 * There a couple of places where we need a rough origin date
 * for scaling/faceting/etc. which is defined here. This needn't
 * be exact - just a date a little older than the oldest searchable
 * records.
 */
export const SEARCH_ORIGIN_DATE = new Date(searchOriginDate.get());

export type QueryFilterOperator = "gt" | "gte" | "lt" | "lte" | "eq";

export type QueryFilter = {
  field: string,
} & ({
  type: "facet",
  value: boolean | string,
  negated: boolean,
} | {
  type: "numeric",
  value: number,
  op: QueryFilterOperator,
});

export type QueryData = {
  index: string,
  sorting?: string,
  search: string
  offset?: number,
  limit?: number,
  preTag?: string,
  postTag?: string,
  filters: QueryFilter[],
}

export type Fuzziness = "AUTO" | number;

type CompiledQuery = {
  searchQuery: QueryDslQueryContainer,
  snippetName: string,
  snippetQuery?: QueryDslQueryContainer,
  highlightName?: string,
  highlightQuery?: QueryDslQueryContainer,
}

class ElasticQuery {
  private config: IndexConfig;

  constructor(
    private queryData: QueryData,
    private fuzziness: Fuzziness = 1,
  ) {
    this.config = indexNameToConfig(queryData.index);
  }

  compileRanking({field, order, weight, scoring}: Ranking): string {
    let expr: string;
    switch (scoring.type) {
    case "numeric":
      const min = scoring.min ?? 1;
      expr = `saturation(Math.max(${min}, doc['${field}'].value), ${scoring.pivot}L)`;
      break;
    case "date":
      const start = SEARCH_ORIGIN_DATE;
      const delta = Date.now() - start.getTime();
      const dayRange = Math.ceil(delta / (1000 * 60 * 60 * 24));
      expr = `1 - decayDateLinear('${start.toISOString()}', '${dayRange}d', '0', 0.5, doc['${field}'].value)`;
      break;
    case "bool":
      expr = `doc['${field}'].value == true ? 0.75 : 0.25`;
      break;
    }
    if (weight) {
      expr = `((${expr}) * ${weight})`;
    }
    expr = `(doc['${field}'].size() == 0 ? 0 : (${expr}))`;
    return order === "asc" ? `(1 - ${expr})` : expr;
  }

  private compileScoreExpression(): string {
    let expr = "_score";
    for (const ranking of this.config.ranking ?? []) {
      expr += " * " + this.compileRanking(ranking);
    }
    return expr;
  }

  private compileFilters() {
    const terms = [...(this.config.filters ?? [])];
    for (const filter of this.queryData.filters) {
      switch (filter.type) {
      case "facet":
        const term: QueryDslQueryContainer = {
          term: {
            [filter.field]: filter.value,
          },
        };
        terms.push(
          filter.negated
            ? {
              bool: {
                should: [],
                must_not: [term],
              },
            }
            : term,
        );
        break;
      case "numeric":
        terms.push({
          range: {
            [filter.field]: {
              [filter.op]: filter.value,
            },
          },
        });
        break;
      }
    }
    return terms.length ? terms : undefined;
  }

  private getDefaultQuery(
    search: string,
    fields: string[],
  ): QueryDslQueryContainer {
    return {
      multi_match: {
        query: search,
        fields,
        fuzziness: this.fuzziness,
        max_expansions: 10,
        prefix_length: 3,
        minimum_should_match: "75%",
        operator: "or",
      },
    };
  }

  private compileSimpleQuery(): CompiledQuery {
    const {fields, snippet, highlight} = this.config;
    const {search} = this.queryData;
    const mainField = this.textFieldToExactField(fields[0], false);
    return {
      searchQuery: {
        bool: {
          should: [
            {
              term: {
                objectID: {
                  value: search,
                },
              },
            },
            this.getDefaultQuery(search, fields),
            {
              multi_match: {
                query: search,
                fields,
                type: "phrase",
                slop: 2,
                boost: 100,
              },
            },
            {
              match_phrase_prefix: {
                [mainField]: {
                  query: search,
                  boost: 1000,
                },
              },
            },
          ],
        },
      },
      snippetName: snippet,
      highlightName: highlight,
    };
  }

  private textFieldToExactField(
    textField: string,
    keepRelevance = true,
  ): string {
    const [fieldName, relevance] = textField.split("^");
    const exactField = `${fieldName}.exact`;
    return relevance && keepRelevance
      ? `${exactField}^${relevance}`
      : exactField;
  }

  private getAdvancedHighlightQuery(
    mustToken: string,
  ): Omit<CompiledQuery, "searchQuery"> {
    const {snippet, highlight} = this.config;
    const snippetName = `${snippet}.exact`;
    const highlightName = `${highlight}.exact`;
    const buildQuery = (fieldName: string) => ({
      match_phrase: {
        [fieldName]: {
          query: mustToken,
          analyzer: "simple",
        },
      },
    });
    return {
      snippetName,
      snippetQuery: buildQuery(snippetName),
      ...(highlight && {
        highlightName,
        highlightQuery: buildQuery(highlightName),
      }),
    };
  }

  private compileAdvancedQuery(tokens: QueryToken[]): CompiledQuery {
    const {fields, snippet, highlight} = this.config;

    const must: QueryDslQueryContainer[] = [];
    const must_not: QueryDslQueryContainer[] = [];
    const should: QueryDslQueryContainer[] = [];

    for (const {type, token} of tokens) {
      switch (type) {
      case "must":
        must.push({
          multi_match: {
            query: token,
            fields: fields.map((field) => this.textFieldToExactField(field)),
            type: "phrase",
          },
        });
        break;
      case "not":
        must_not.push({
          multi_match: {
            query: token,
            fields,
          },
        });
        break;
      case "should":
        should.push(this.getDefaultQuery(token, fields));
        break;
      }
    }

    const searchQuery: QueryDslQueryContainer = {
      bool: {
        must,
        must_not,
        should,
      },
    };

    if (must.length) {
      return {
        searchQuery,
        ...this.getAdvancedHighlightQuery(must[0].multi_match!.query),
      };
    }

    return {
      searchQuery,
      snippetName: snippet,
      snippetQuery: this.getDefaultQuery(
        this.queryData.search,
        this.config.fields,
      ),
      highlightName: highlight,
      highlightQuery: this.getDefaultQuery(
        this.queryData.search,
        this.config.fields,
      ),
    };
  }

  private compileEmptyQuery(): CompiledQuery {
    return {
      searchQuery: {
        match_all: {},
      },
      snippetName: "",
    };
  }

  private compileQuery(): CompiledQuery {
    const {search} = this.queryData;
    if (!search) {
      return this.compileEmptyQuery();
    }
    const {tokens, isAdvanced} = parseQuery(search);
    return isAdvanced
      ? this.compileAdvancedQuery(tokens)
      : this.compileSimpleQuery();
  }

  private compileSort(sorting?: string): Sort {
    const sort: Sort = [
      {_score: {order: "desc"}},
      {[this.config.tiebreaker]: {order: "desc"}},
    ];
    switch (sorting) {
    case "karma":
      const field = this.config.karmaField ?? "baseScore";
      sort.unshift({[field]: {order: "desc"}});
      break;
    case "newest_first":
      sort.unshift({publicDateMs: {order: "desc"}});
      break;
    case "oldest_first":
      sort.unshift({publicDateMs: {order: "asc"}});
      break;
    case "relevance":
      break;
    default:
      if (sorting) {
        throw new Error("Invalid sorting: " + sorting);
      }
    }
    return sort;
  }

  compile(): SearchRequestInfo | SearchRequestBody {
    const {
      preTag,
      postTag,
      index,
      sorting,
      offset = 0,
      limit = 10,
    } = this.queryData;
    const {privateFields} = this.config;
    const {
      searchQuery,
      snippetName,
      snippetQuery,
      highlightName,
      highlightQuery,
    } = this.compileQuery();
    const highlightConfig =  {
      type: "plain",
      pre_tags: [preTag ?? "<em>"],
      post_tags: [postTag ?? "</em>"],

      // This is the default value for index.highlight.max_analyzed_offset
      // which we haven't customized. If this wasn't set here or was set
      // larger than the corresponding setting on the index, then search
      // would fail entirely when results contain a poss where the
      // plain-text version of the body is larger than this.
      max_analyzed_offset: 1000000,
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
            [snippetName]: {
              ...highlightConfig,
              highlight_query: snippetQuery,
            },
            ...(highlightName && {
              [highlightName]: {
                ...highlightConfig,
                highlight_query: highlightQuery,
              },
            }),
          },
          number_of_fragments: 1,
          fragment_size: 140,
          no_match_size: 140,
        },
        query: {
          script_score: {
            query: {
              bool: {
                must: searchQuery,
                should: [],
                filter: this.compileFilters(),
              },
            },
            script: {
              source: this.compileScoreExpression(),
            },
          },
        },
        sort: this.compileSort(sorting),
        _source: {
          exclude: ["exportedAt", ...privateFields],
        },
      },
    };
  }
}

export default ElasticQuery;
