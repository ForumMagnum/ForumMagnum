import ElasticClient, { ElasticSearchHit } from "./ElasticClient";
import type { SearchResult } from "./SearchResult";
import { algoliaPrefixSetting } from '@/lib/instanceSettings';
import { indexNameToConfig } from "./ElasticConfig";
import {
  QueryFilter,
  QueryFilterOperator,
  SEARCH_ORIGIN_DATE,
} from "./ElasticQuery";
import moment from "moment";
import type { SearchOptions, SearchQuery } from "@/lib/search/NativeSearchClient";

type SanitizedIndexName = {
  index: string | string[],
  sorting?: string,
}

type NamedHighlight = {
  value?: string,
  matchLevel: "full" | "none",
}

const extractNamedHighlight = (
  highlight: ElasticSearchHit["highlight"],
  name: string,
): NamedHighlight => {
  const value = highlight?.[name]?.[0] ?? highlight?.[name + ".exact"]?.[0];
  return {
    value,
    matchLevel: value ? "full" : "none",
  };
}

class ElasticService {
  constructor(
    private client = new ElasticClient(),
  ) {}

  async runQuery({indexName, params}: SearchQuery, options: SearchOptions): Promise<SearchResult> {
    const start = Date.now();

    const {index, sorting} = this.sanitizeIndexName(indexName);
    const search = params.query ?? "";
    const hitsPerPage = params.hitsPerPage ?? 10;
    const page = params.page ?? 0;
    const skipSearch = search==="" && options.emptyStringSearchResults==="empty";
    const result = skipSearch
      ? {hits: {
          total: 0,
          hits: [],
        }}
      : await (
        Array.isArray(index)
          ? this.client.multiSearch({
            indexes: index,
            search,
            offset: page * hitsPerPage,
            limit: hitsPerPage,
          })
          : this.client.search({
            index,
            sorting,
            search,
            offset: page * hitsPerPage,
            limit: hitsPerPage,
            preTag: params.highlightPreTag,
            postTag: params.highlightPostTag,
            filters: this.parseFilters(params.facetFilters, params.numericFilters, params.existsFilters),
            coordinates: this.parseLatLng(params.aroundLatLng),
          })
      );

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
      query: params.query ?? "",
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
       * controls for choosing facets (most notably, publicDateMs). For now we're just
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

  parseFilters(
    facetFilters?: string[][],
    numericFilters?: string[],
    existsFilters?: string[],
  ): QueryFilter[] {
    const result: QueryFilter[] = [];

    for (const group of facetFilters ?? []) {
      for (const facet of group) {
        let [field, value] = facet.split(":");
        if (!field || !value) {
          throw new Error("Invalid facet: " + facet);
        }
        let negated = false;
        if (value[0] === "-") {
          negated = true;
          value = value.slice(1);
        }
        result.push({
          type: "facet",
          field,
          value: this.parseFacetValue(value),
          negated,
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

    for (const filter of existsFilters ?? []) {
      result.push({
        type: "exists",
        field: filter,
      });
    }

    return result;
  }

  private parseFacetValue(value: string): boolean | string | null {
    switch (value) {
    case "true":
      return true;
    case "false":
      return false;
    case "null":
        return null;
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

  /**
   * We want coordinates in the format [lng, lat], not [lat, lng]
   * They're passed in as a string like "75, -0.5"
   */
  private parseLatLng(value?: string): number[] | undefined {
    if (!value) {
      return undefined;
    }
    const coordinates = value.split(", ").map((n) => parseFloat(n));
    if (coordinates.length !== 2) {
      return undefined;
    }
    for (const coordinate of coordinates) {
      if (typeof coordinate !== "number" || !Number.isFinite(coordinate)) {
        return undefined;
      }
    }
    return [coordinates[1], coordinates[0]];
  }

  private urlEncode(params: Record<string, unknown>): string {
    const data = Object.keys(params).map((key) => `${key}=${params[key]}`);
    return encodeURIComponent(data.join("&"));
  }

  private sanitizeIndexName(indexName: string): SanitizedIndexName {
    const prefix = algoliaPrefixSetting.get();
    if (prefix) {
      indexName = indexName.replace(new RegExp(prefix, "g"), "");
    }
    const tokens = indexName.split("_");
    const indexNames = tokens[0].split(",");
    const sorting = tokens.length > 1 ? tokens.slice(1).join("_") : undefined;
    return {
      index: indexNames.length > 1 ? indexNames : indexNames[0],
      sorting,
    };
  }

  private getHits(
    indexName: string | string[],
    hits: ElasticSearchHit[],
  ): SearchDocument[] {
    if (Array.isArray(indexName)) {
      return hits.map(({_id, _source, _index}) => ({
        ..._source,
        _id,
        _index: _index.split("_")[0],
      }))
    } else {
      const config = indexNameToConfig(indexName);
      return hits.map(({_id, _source, highlight}) => ({
        ..._source,
        _id,
        _index: indexName,
        _snippetResult: {
          [config.snippet]: extractNamedHighlight(highlight, config.snippet),
        },
        ...(config.highlight && {
          _highlightResult: {
            [config.highlight]: extractNamedHighlight(highlight, config.highlight),
          },
        }),
      }));
    }
  }
}

export default ElasticService;
