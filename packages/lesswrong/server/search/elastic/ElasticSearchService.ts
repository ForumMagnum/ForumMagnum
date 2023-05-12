import ElasticSearchClient, { ElasticSearchHit } from "./ElasticSearchClient";
import type { SearchQuery } from "./searchQuery";
import type { SearchResult } from "./searchResult";
import { algoliaPrefixSetting } from "../../../lib/publicSettings";
import { indexNameToConfig } from "./ElasticSearchConfig";
import type { QueryFilter } from "./ElasticSearchQuery";

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
      filters: this.parseFacetFilters(params.facetFilters),
    });

    const nbHits = typeof result.hits.total === "number"
      ? result.hits.total
      : result.hits.total?.value ?? 0;

    const end = Date.now();
    const timeMS = end - start;

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
    };
  }

  private parseFacetFilters(facets?: string[][]): QueryFilter[] {
    const result: QueryFilter[] = [];
    for (const group of facets ?? []) {
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
