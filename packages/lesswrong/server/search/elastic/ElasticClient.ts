import { Client } from "@elastic/elasticsearch";
import type {
  SearchHit,
  SearchRequest,
  SearchResponse,
  SearchTotalHits,
} from "@elastic/elasticsearch/lib/api/types";
import { compilePersonLookup, PersonCandidate, PersonSearch, resolvePersonSearch } from "./ElasticPersonSearch";
import ElasticQuery, { QueryData } from "./ElasticQuery";
import type { MultiQueryData } from "./ElasticMultiQuery";
import { compileSearchQuery, personSearchApplies, SearchQueryData } from "./ElasticAdditiveRanking";
import sortBy from "lodash/sortBy";
import { isElasticEnabled } from "../../../lib/instanceSettings";
import take from "lodash/take";
import LRU from "lru-cache";

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

const personLookupCache = new LRU<string, Promise<PersonSearch | undefined>>({
  maxAge: 1000 * 60,
  updateAgeOnGet: false,
  max: 1000,
});

/** Shares one promise per key between callers, and forgets it if it rejects */
export function cachedPromise<T>(cache: LRU<string, Promise<T>>, key: string, compute: () => Promise<T>): Promise<T> {
  let result = cache.get(key);
  if (!result) {
    result = compute();
    cache.set(key, result);
    result.catch(() => cache.del(key));
  }
  return result;
}

async function lookupPerson(client: Client, search: string): Promise<PersonSearch | undefined> {
  const lookup = compilePersonLookup(search);
  if (!lookup) return undefined;
  const candidates = await completeSearch<PersonCandidate>(client, lookup);
  return resolvePersonSearch(search, candidates.hits.hits.flatMap(hit => hit._source ? [hit._source] : []));
}

async function completeSearch<TDocument>(client: Client, request: SearchRequest): Promise<SearchResponse<TDocument>> {
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

  async unifiedSearch(queryData: SearchQueryData): Promise<HitsOnlySearchResponse> {
    const search = queryData.search.trim();
    const person = personSearchApplies(queryData)
      ? await cachedPromise(personLookupCache, search, () => lookupPerson(this.client, search))
      : undefined;
    return completeSearch<ElasticDocument>(this.client, compileSearchQuery({...queryData, person}));
  }
}

export default ElasticClient;
