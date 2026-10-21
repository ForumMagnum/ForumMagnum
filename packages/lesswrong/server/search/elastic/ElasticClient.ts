import { Client } from "@elastic/elasticsearch";
import type {
  SearchHit,
  SearchRequest,
  SearchResponse,
  SearchTotalHits,
} from "@elastic/elasticsearch/lib/api/types";
import { compilePersonLookup, PersonCandidate, resolvePersonSearch } from "./ElasticPersonSearch";
import ElasticQuery, { QueryData } from "./ElasticQuery";
import { compileSearchQuery } from "./ElasticAdditiveRanking";
import type { SearchQueryData } from "./searchQueryTypes";
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

export interface SearchExecutor {
  search<TDocument>(request: SearchRequest): Promise<SearchResponse<TDocument>>;
}

export async function executeSearch(client: SearchExecutor, queryData: SearchQueryData): Promise<HitsOnlySearchResponse> {
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

  lookup(queryData: QueryData): Promise<HitsOnlySearchResponse> {
    const query = new ElasticQuery({...queryData, mode: "lookup"});
    const request = query.compile();
    if (DEBUG_LOG_ELASTIC_QUERIES) {
      // eslint-disable-next-line no-console
      console.log("Elastic query:", JSON.stringify(request, null, 2));
    }
    return this.client.search(request);
  }

  async search(queryData: SearchQueryData): Promise<HitsOnlySearchResponse> {
    return executeSearch(this.client, queryData);
  }
}

export default ElasticClient;
