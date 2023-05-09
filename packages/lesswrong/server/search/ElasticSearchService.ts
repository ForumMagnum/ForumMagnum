import ElasticSearchClient, { ElasticSearchHit } from "./ElasticSearchClient";
import type { SearchQuery } from "./searchQuery";
import type { SearchResult } from "./searchResult";
import { algoliaPrefixSetting } from "../../lib/publicSettings";

class ElasticSearchService {
  constructor(
    private client = new ElasticSearchClient(),
  ) {}

  async runQuery({indexName, params}: SearchQuery): Promise<SearchResult> {
    const start = Date.now();

    const hitsPerPage = params.hitsPerPage ?? 10;
    const page = params.page ?? 0;
    const result = await this.client.search({
      index: this.sanitizeIndexName(indexName),
      search: params.query,
      offset: page * hitsPerPage,
      limit: hitsPerPage,
      preTag: params.highlightPreTag,
      postTag: params.highlightPostTag,
    });

    const nbHits = typeof result.hits.total === "number"
      ? result.hits.total
      : result.hits.total?.value ?? 0;

    const end = Date.now();
    const timeMS = end - start;

    return {
      hits: this.getHits(result.hits.hits),
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

  private getHits(hits: ElasticSearchHit[]): AlgoliaDocument[] {
    return hits.map(({_id, _source, highlight}) => ({
      ..._source,
      _id,
      _snippetResult: {
        body: {
          value: highlight?.body?.[0],
          matchLevel: highlight?.body?.[0] ? "full" : "none",
        },
      },
      _highlightResult: {
        title: {
          value: highlight?.title?.[0],
          matchLevel: highlight?.title?.[0] ? "full" : "none",
        },
      },
    }));
  }
}

export default ElasticSearchService;
