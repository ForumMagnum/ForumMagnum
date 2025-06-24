import type {
  QueryDslQueryContainer,
  SearchRequest as SearchRequestInfo,
  Sort,
} from "@elastic/elasticsearch/lib/api/types";
import type {
  SearchRequest as SearchRequestBody,
} from "@elastic/elasticsearch/lib/api/typesWithBodyKey";
import {
  IndexConfig,
  Ranking,
  isFullTextField,
  indexToCollectionName,
  collectionNameToConfig,
} from "./ElasticConfig";
import { parseQuery, QueryToken } from "./parseQuery";
import { searchOriginDate } from "@/lib/instanceSettings";
import { SearchIndexCollectionName } from "../../../lib/search/searchUtil";

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
  value: boolean | string | null,
  negated: boolean,
} | {
  type: "numeric",
  value: number,
  op: QueryFilterOperator,
} | {
  type: "exists"
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
  // Providing coordinates will trigger a special case, which sorts results by distance and ignores relevance
  coordinates?: number[],
}

export type Fuzziness = "AUTO" | number;

type CompiledQuery = {
  tokens: QueryToken[],
  searchQuery: QueryDslQueryContainer,
  snippetName: string,
  snippetQuery?: QueryDslQueryContainer,
  highlightName?: string,
  highlightQuery?: QueryDslQueryContainer,
}

class ElasticQuery {
  private collectionName: SearchIndexCollectionName;
  private config: IndexConfig;

  constructor(
    private queryData: QueryData,
    private fuzziness: Fuzziness = 1,
  ) {
    this.collectionName = indexToCollectionName(queryData.index);
    this.config = collectionNameToConfig(this.collectionName);
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

  private compileFacet(
    field: string,
    value: boolean | string | null,
    negated: boolean,
  ): QueryDslQueryContainer {
    if (value === null) {
      const term: QueryDslQueryContainer = {
        exists: {
          field,
        },
      };
      return negated
        ? term
        : {
          bool: {
            should: [],
            must_not: [term],
          },
        };
    }

    const term: QueryDslQueryContainer = isFullTextField(this.collectionName, field)
      ? {
        match: {
          [`${field}.exact`]: {
            query: value,
            analyzer: "fm_exact_analyzer",
            operator: "AND",
            fuzziness: 0,
          },
        },
      }
      : {
        term: {
          [field]: value,
        },
      };
    return negated
      ? {
        bool: {
          should: [],
          must_not: [term],
        },
      }
      : term;
  }

  private compileFilterTermForField(filter: QueryFilter): QueryDslQueryContainer {
    switch (filter.type) {
    case "facet":
      return this.compileFacet(filter.field, filter.value, filter.negated);

    case "numeric":
      return {
        range: {
          [filter.field]: {
            [filter.op]: filter.value,
          },
        },
      };

    case "exists":
      return {
        bool: {
          should: [],
          must: [{
            exists: {
              field: filter.field
            }
          }]
        }
      };

    default:
      return {};
    }
  }

  private compileFilters(tokens: QueryToken[]) {
    const filtersByField: Record<string, QueryFilter[]> = {};
    for (const filter of this.queryData.filters) {
      filtersByField[filter.field] ??= [];
      filtersByField[filter.field].push(filter);
    }

    const terms = [...(this.config.filters ?? [])];

    for (const filterField in filtersByField) {
      const filters = filtersByField[filterField];
      if (!filters.length) {
        continue;
      }
      const fieldTerms = filters.map(
        (filter) => this.compileFilterTermForField(filter),
      );
      if (fieldTerms.length > 1) {
        terms.push({
          bool: {
            should: fieldTerms,
          },
        });
      } else {
        terms.push(fieldTerms[0]);
      }
    }

    const userFilters: QueryDslQueryContainer[] = [];
    const tagFilters: QueryDslQueryContainer[] = [];
    for (const {type, token} of tokens) {
      if (type === "user") {
        userFilters.push(
          {term: {"authorSlug.sort": token}},
          {term: {"authorDisplayName.sort": token}},
          {term: {userId: token}},
        );
      } else if (type === "tag") {
        tagFilters.push(
          {term: {"tags._id": token}},
          {term: {"tags.slug": {value: token, case_insensitive: true}}},
          {term: {"tags.name": {value: token, case_insensitive: true}}},
        );
      }
    }
    if (userFilters.length) {
      terms.push({bool: {should: userFilters}});
    }
    if (tagFilters.length) {
      terms.push({bool: {should: tagFilters}});
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

  private compileSimpleQuery(tokens: QueryToken[]): CompiledQuery {
    const {fields, snippet, highlight} = this.config;
    const {search} = this.queryData;
    const mainField = this.textFieldToExactField(fields[0], false);
    return {
      tokens,
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
      tokens: [{ type: "must", token: mustToken }],
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
      case "user":
      case "tag":
        // Do nothing - this is handled by `this.compileFilters`
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

    const highlightQueryString = tokens.filter(
      ({type}) => type !== "user" && type !== "tag",
    ).map(({token}) => token).join(" ");
    const highlightQuery = this.getDefaultQuery(
      highlightQueryString,
      this.config.fields,
    );

    return {
      tokens,
      searchQuery,
      snippetName: snippet,
      snippetQuery: highlightQuery,
      highlightName: highlight,
      highlightQuery,
    };
  }

  private compileEmptyQuery(): CompiledQuery {
    return {
      tokens: [],
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
      : this.compileSimpleQuery(tokens);
  }

  private compileSort(sorting?: string, coordinates?: number[]): Sort {
    // Special case:
    // When providing coordinates in the format [lng, lat], we sort by distance
    // and ignore the relevance score. See also parseLatLng()
    if (coordinates) {
      if (!this.config.locationField) {
        throw new Error("Index cannot be sorted by location");
      }
      return [
        {
          _geo_distance : {
            [this.config.locationField]: coordinates,
            order : "asc",
          },
        },
        {[this.config.tiebreaker]: {order: "desc"}},
      ];
    }

    const sort: Sort = [
      {[this.config.tiebreaker]: {order: "desc"}},
    ];

    // If we specify a custom sort (such as from the people directory) then
    // we should ignore the search _score completely when sorting
    if (sorting && sorting.indexOf(":") > 0) {
      const [field, order] = sorting.split(":");
      if (order !== "asc" && order !== "desc") {
        throw new Error("Invalid sorting order");
      }
      sort.unshift({[field]: {order}});
      return sort;
    } else {
      sort.unshift({_score: {order: "desc"}});
    }

    // There are several special sortings builtin to the main search page.
    // Note that these are used in conjunction with the search _score
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
      coordinates,
    } = this.queryData;
    const {privateFields} = this.config;

    // When sorting by nearest-geographically we disable custom highlighting as
    // this isn't supported by elastic and causes an exception
    const hasCustomHighlight = !coordinates;

    const {
      tokens,
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
        ...(hasCustomHighlight && {
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
        }),
        query: {
          script_score: {
            query: {
              bool: {
                must: searchQuery,
                should: [],
                filter: this.compileFilters(tokens),
              },
            },
            script: {
              source: this.compileScoreExpression(),
            },
          },
        },
        sort: this.compileSort(sorting, coordinates),
        _source: {
          excludes: ["exportedAt", ...privateFields],
        },
      },
    };
  }
}

export default ElasticQuery;
