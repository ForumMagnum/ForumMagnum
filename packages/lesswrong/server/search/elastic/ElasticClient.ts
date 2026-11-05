import { Client } from "@elastic/elasticsearch";
import type {
  SearchHit,
  SearchRequest,
  SearchResponse,
  SearchTotalHits,
} from "@elastic/elasticsearch/lib/api/types";
import { compilePersonLookup, PersonCandidate, resolvePersonSearch } from "./ElasticPersonSearch";
import ElasticQuery, { QueryData } from "./ElasticQuery";
import type { MultiQueryData } from "./ElasticMultiQuery";
import { compileSearchQuery } from "./ElasticAdditiveRanking";
import type { SearchQueryData } from "./searchQueryTypes";
import sortBy from "lodash/sortBy";
import { isElasticEnabled } from "../../../lib/instanceSettings";
import take from "lodash/take";

export type ElasticDocument = Exclude<SearchDocument, "_id">;
export type ElasticSearchHit = SearchHit<ElasticDocument>;
export type ElasticSearchResponse = SearchResponse<ElasticDocument>;

export type HitsOnlySearchResponse = {
  hits: {
    total?: number|SearchTotalHits
    hits: ElasticSearchHit[]
  }
};

const DEBUG_LOG_ELASTIC_QUERIES = false;

let globalClient: Client | null = null;

interface SearchExecutor {
  search<TDocument>(request: SearchRequest): Promise<SearchResponse<TDocument>>;
}

async function executeSearch(client: SearchExecutor, queryData: SearchQueryData): Promise<HitsOnlySearchResponse> {
  const lookup = compilePersonLookup(queryData.search);
  const candidates = lookup ? await completeSearch<PersonCandidate>(client, lookup) : undefined;
  const person = resolvePersonSearch(queryData.search, candidates?.hits.hits.flatMap(hit => hit._source ? [hit._source] : []) ?? []);
  return completeSearch<ElasticDocument>(client, compileSearchQuery({...queryData, person}));
}

async function completeSearch<TDocument>(client: SearchExecutor, request: SearchRequest): Promise<SearchResponse<TDocument>> {
  const response = await client.search<TDocument>({...request, allow_partial_search_results: false});
  if (response.timed_out) throw new Error("Search timed out before producing complete results");
  const failed = response._shards?.failed ?? 0;
  if (failed > 0) {
    const reasons = (response._shards.failures ?? []).map(failure => failure.reason?.reason ?? failure.reason?.type ?? "unknown").join("; ");
    throw new Error(`Search failed on ${failed} shard(s): ${reasons}`);
  }
  return response;
}

class ElasticClient {
  private client: Client;

  constructor() {
    if (!isElasticEnabled()) {
      throw new Error("Elasticsearch is not enabled");
    }

    const cloudId = process.env.private_elasticsearch_cloudId;
    const username = process.env.private_elasticsearch_username;
    const password = process.env.private_elasticsearch_password;

    if (!cloudId || !username || !password) {
      // eslint-disable-next-line no-console
      console.warn("Elastic is enabled, but credentials are missing");
      return;
    }

    if (!globalClient) {
      globalClient = new Client({
        requestTimeout: 600000,
        cloud: {id: cloudId},
        auth: {
          username,
          password,
        },
      });
      if (!globalClient) {
        throw new Error("Failed to connect to Elasticsearch");
      }
    }

    this.client = globalClient;
  }

  getClient() {
    return this.client;
  }

  search(queryData: QueryData): Promise<HitsOnlySearchResponse> {
    const query = new ElasticQuery(queryData);
    const request = query.compile();
    if (DEBUG_LOG_ELASTIC_QUERIES) {
      // eslint-disable-next-line no-console
      console.log("Elastic query:", JSON.stringify(request, null, 2));
    }
    return this.client.search(request);
  }

  async multiSearch(queryData: MultiQueryData): Promise<HitsOnlySearchResponse> {
    // Perform the same search against each index
    const resultsBySearchIndex = await Promise.all(
      queryData.indexes.map((searchIndex) =>
        this.client.search(new ElasticQuery({
          index: searchIndex,
          filters: [],
          limit: queryData.limit,
          search: queryData.search,
          offset: queryData.offset,
        }).compile())
      )
    )

    // Normalize scores within each index to [0, 1] before merging, so that
    // differences in analyzers/boosts between indexes don't cause one index's
    // results to dominate the merged list.
    const normalizedResults = resultsBySearchIndex.flatMap(indexResult => {
      const hits = indexResult.hits.hits;
      const maxScore = hits.reduce((max, h) => Math.max(max, h._score ?? 0), 0);
      if (maxScore <= 0) return hits;
      return hits.map(h => ({ ...h, _score: (h._score ?? 0) / maxScore }));
    });

    const sortedResults = take(sortBy(normalizedResults, h => -(h._score ?? 0)), queryData.limit);

    return {
      hits: {
        total: normalizedResults.length,
        hits: sortedResults as ElasticSearchHit[],
      },
    };
  }

  unifiedSearch(queryData: SearchQueryData): Promise<HitsOnlySearchResponse> {
    return executeSearch(this.client, queryData);
  }
}

export default ElasticClient;
