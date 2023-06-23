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

class ElasticQuery {
  private config: IndexConfig;

  constructor(
    private queryData: QueryData,
    private fuzziness: Fuzziness = 1,
  ) {
    this.config = indexNameToConfig(queryData.index);
  }

  private getHighlightTags() {
    const {preTag, postTag} = this.queryData;
    return {
      pre_tags: [preTag ?? "<em>"],
      post_tags: [postTag ?? "</em>"],
    };
  }

  compileRanking({field, order, weight, scoring}: Ranking): string {
    let expr: string;
    switch (scoring.type) {
    case "numeric":
      expr = `saturation(Math.max(1, doc['${field}'].value), ${scoring.pivot}L)`;
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
        terms.push({
          term: {
            [filter.field]: filter.value,
          },
        });
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

  private compileSimpleQuery(): QueryDslQueryContainer {
    const {fields} = this.config;
    const {search} = this.queryData;
    return {
      bool: {
        should: [
          {
            term: {
              objectID: {
                value: search,
              },
            },
          },
          {
            multi_match: {
              query: search,
              fields,
              fuzziness: this.fuzziness,
              max_expansions: 10,
              prefix_length: 2,
              minimum_should_match: "50%",
              operator: "or",
              analyzer: "fm_synonym_analyzer",
            },
          },
          {
            multi_match: {
              query: search,
              fields,
              type: "phrase",
              slop: 2,
              boost: 70,
              analyzer: "fm_synonym_analyzer",
            },
          },
          {
            match_phrase_prefix: {
              [fields[0].split("^")[0]]: {
                query: search,
                slop: 2,
                boost: 70,
                analyzer: "fm_synonym_analyzer",
              },
            },
          },
        ],
      },
    };
  }

  private textFieldToExactField(textField: string): string {
    const [fieldName, relevance] = textField.split("^");
    const exactField = `${fieldName}.exact`;
    return relevance ? `${exactField}^${relevance}` : exactField;
  }

  private compileAdvancedQuery(tokens: QueryToken[]): QueryDslQueryContainer {
    const {fields} = this.config;

    const must: QueryDslQueryContainer[] = [];
    const must_not: QueryDslQueryContainer[] = [];
    const should: QueryDslQueryContainer[] = [];

    for (const {type, token} of tokens) {
      switch (type) {
      case "must":
        must.push({
          multi_match: {
            query: token,
            fields: fields.map(this.textFieldToExactField.bind(this)),
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
        should.push({
          multi_match: {
            query: token,
            fields,
            fuzziness: this.fuzziness,
            max_expansions: 10,
            prefix_length: 2,
            minimum_should_match: "75%",
            operator: "and",
          },
        });
        break;
      }
    }

    return {
      bool: {
        must,
        must_not,
        should,
      },
    };
  }

  private compileQuery(): QueryDslQueryContainer {
    const {search} = this.queryData;
    if (!search) {
      return {
        match_all: {},
      };
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
      index,
      sorting,
      offset = 0,
      limit = 10,
    } = this.queryData;
    const {snippet, highlight, privateFields} = this.config;
    const tags = this.getHighlightTags();
    return {
      index,
      from: offset,
      size: limit,
      body: {
        track_scores: true,
        track_total_hits: true,
        highlight: {
          fields: {
            [snippet]: tags,
            ...(highlight && {[highlight]: tags}),
          },
          fragment_size: 140,
          no_match_size: 140,
        },
        query: {
          script_score: {
            query: {
              bool: {
                must: this.compileQuery(),
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
