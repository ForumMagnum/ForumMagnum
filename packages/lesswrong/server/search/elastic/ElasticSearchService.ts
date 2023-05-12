import ElasticSearchClient, { ElasticSearchHit } from "./ElasticSearchClient";
import type { SearchQuery } from "./searchQuery";
import type { SearchResult } from "./searchResult";
import { algoliaPrefixSetting } from "../../../lib/publicSettings";
import { indexNameToConfig } from "./ElasticSearchConfig";
import {
  QueryFilter,
  QueryFilterOperator,
  SEARCH_ORIGIN_DATE,
} from "./ElasticSearchQuery";
import moment from "moment";

class ElasticSearchService {
  constructor(
    private client = new ElasticSearchClient(),
  ) {}

  async runQuery({indexName, params}: SearchQuery): Promise<SearchResult> {
    const start = Date.now();

    const index = this.sanitizeIndexName(indexName);
    const hitsPerPage = params.hitsPerPage ?? 10;
    const page = params.page ?? 0;
    const result = await this.client.search({
      index,
      search: params.query,
      offset: page * hitsPerPage,
      limit: hitsPerPage,
      preTag: params.highlightPreTag,
      postTag: params.highlightPostTag,
      filters: this.parseFilters(params.facetFilters, params.numericFilters),
    });

    const nbHits = typeof result.hits.total === "number"
      ? result.hits.total
      : result.hits.total?.value ?? 0;

    const end = Date.now();
    const timeMS = end - start;

    const pastDay = moment().subtract(24, "hours").valueOf();
    const pastWeek = moment().subtract(7, "days").valueOf();
    const pastMonth = moment().subtract(1, "months").valueOf();
    const pastYear = moment().subtract(1, "years").valueOf();

    return {
      hits: this.getHits(index, result.hits.hits),
      nbHits,
      page,
      nbPages: Math.ceil(nbHits / hitsPerPage),
      hitsPerPage,
      exhaustiveNbHits: true,
      exhaustiveType: true,
      exhaustive: {
        nbHits: true,
        typo: true,
      },
      query: params.query,
      params: this.urlEncode(params),
      index: indexName,
      processingTimeMS: timeMS,
      processingTimingsMS: {
        request: {
          roundTrip: timeMS,
        },
      },
      serverTimeMS: timeMS,
      /**
       * `facets` and `facets_stats` are needed to tell the frontend it should enable
       * controls for choose facets (most notably, publicDateMs). For now we're just
       * passing in dummy values, but maybe we should calculate the actual amount?
       * It's probably not worth the performance hit though...
       */
      facets: {
        publicDateMs: {
          [pastDay]: 1,
          [pastWeek]: 1,
          [pastMonth]: 1,
          [pastYear]: 1,
        },
      },
      facets_stats: {
        publicDateMs: {
          min: SEARCH_ORIGIN_DATE.getTime(),
          max: new Date().getTime(),
        },
      },
    };
  }

  private parseFilters(
    facetFilters?: string[][],
    numericFilters?: string[],
  ): QueryFilter[] {
    const result: QueryFilter[] = [];

    for (const group of facetFilters ?? []) {
      for (const facet of group) {
        const [field, value] = facet.split(":");
        if (!field || !value) {
          throw new Error("Invalid facet: " + facet);
        }
        result.push({
          type: "facet",
          field,
          value: this.parseFacetValue(value),
        });
      }
    }

    for (const numeric of numericFilters ?? []) {
      let op: QueryFilterOperator = "lt";
      let opIndex = numeric.indexOf("<");
      let opLength = 1;
      if (opIndex < 0) {
        op = "gt";
        opIndex = numeric.indexOf(">");
        if (opIndex < 0) {
          op = "eq";
          opIndex = numeric.indexOf("=");
          if (opIndex < 0) {
            throw new Error("Invalid numeric: " + numeric);
          }
        }
      }
      if (op !== "eq" && numeric[opIndex + 1] === "=") {
        op = (op + "e") as QueryFilterOperator;
        opLength = 2;
      }
      const field = numeric.slice(0, opIndex);
      const value = numeric.slice(opIndex + opLength);
      if (!field || !value) {
        throw new Error("Invalid numeric: " + numeric);
      }
      result.push({
        type: "numeric",
        field,
        value: this.parseNumericValue(value),
        op,
      });
    }

    return result;
  }

  private parseFacetValue(value: string): boolean | string {
    switch (value) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return value;
    }
  }

  private parseNumericValue(value: string): number {
    const parsed = parseInt(value);
    if (!Number.isSafeInteger(parsed)) {
      throw new Error("Invalid numeric value: " + value);
    }
    return parsed;
  }

  private urlEncode(params: Record<string, unknown>): string {
    const data = Object.keys(params).map((key) => `${key}=${params[key]}`);
    return encodeURIComponent(data.join("&"));
  }

  private sanitizeIndexName(indexName: string): string {
    const prefix = algoliaPrefixSetting.get();
    return prefix && indexName.indexOf(prefix) === 0
      ? indexName.slice(prefix.length)
      : indexName;
  }

  private getHits(indexName: string, hits: ElasticSearchHit[]): AlgoliaDocument[] {
    const config = indexNameToConfig(indexName);
    return hits.map(({_id, _source, highlight}) => ({
      ..._source,
      _id,
      _snippetResult: {
        [config.snippet]: {
          value: highlight?.[config.snippet]?.[0],
          matchLevel: highlight?.[config.snippet]?.[0] ? "full" : "none",
        },
      },
      ...(config.highlight && {
        _highlightResult: {
          [config.highlight]: {
            value: highlight?.[config.highlight]?.[0],
            matchLevel: highlight?.[config.highlight]?.[0] ? "full" : "none",
          },
        },
      }),
    }));
  }
}

export default ElasticSearchService;
