import { Client } from "@elastic/elasticsearch";
import type {
  SearchHit,
  SearchRequest,
  SearchResponse,
  SearchTotalHits,
} from "@elastic/elasticsearch/lib/api/types";
import { compilePersonLookup, PersonCandidate, resolvePersonSearch } from "./ElasticPersonSearch";
import ElasticQuery, { QueryData } from "./ElasticQuery";
import { compileMultiQuery, defaultUnifiedRanking } from "./ElasticMultiQuery";
import type { MultiQueryData } from "./unifiedSearchTypes";
import { isElasticEnabled } from "../../../lib/instanceSettings";

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

/**
 * Resolve people before ES ranks and paginates. The tiered ranking also promotes
 * at most two related sequences; the additive ranking has no reserved positions.
 */
export interface UnifiedSearchClient {
  search<TDocument>(request: SearchRequest): Promise<SearchResponse<TDocument>>;
}

export async function executeMultiSearch(client: UnifiedSearchClient, queryData: MultiQueryData): Promise<HitsOnlySearchResponse> {
  const lookup = compilePersonLookup(queryData.search);
  const candidates = lookup ? await completeSearch<PersonCandidate>(client, lookup) : undefined;
  const person = resolvePersonSearch(queryData.search, candidates?.hits.hits.flatMap(hit => hit._source ? [hit._source] : []) ?? []);
  if ((queryData.ranking ?? defaultUnifiedRanking) === "additive") {
    return completeSearch<ElasticDocument>(client, compileMultiQuery({...queryData, person}));
  }
  let featuredSequenceIds: string[] = [];
  if (person && queryData.indexes.includes("sequences")) {
    const sequenceRequest = compileMultiQuery({...queryData, indexes: ["sequences"], person, offset: 0, limit: 2});
    // Only reserve positions for sequences that actually collect this author's writing.
    sequenceRequest.query = {bool: {
      should: [], must: [sequenceRequest.query ?? {match_none: {}}],
      filter: [{terms: {collectedAuthorIds: person.userIds}}],
    }};
    const sequences = await completeSearch<ElasticDocument>(client, sequenceRequest);
    featuredSequenceIds = sequences.hits.hits.flatMap(hit => hit._source ? [hit._source.objectID] : []);
  }
  return completeSearch<ElasticDocument>(client, compileMultiQuery({...queryData, person, featuredSequenceIds}));
}

/**
 * A multi-index request keeps going when one index's shards fail (for example a
 * script error on one mapping), silently dropping that whole content type from
 * the ranking. Treat that as an error rather than serving a partial list.
 */
async function completeSearch<TDocument>(client: UnifiedSearchClient, request: SearchRequest): Promise<SearchResponse<TDocument>> {
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
    return executeMultiSearch(this.client, queryData);
  }
}

export default ElasticClient;
