import { Client } from "@elastic/elasticsearch";
import type {
  AggregationsTopHitsAggregate,
  SearchHit,
  SearchResponse,
} from "@elastic/elasticsearch/lib/api/types";
import ElasticQuery, { QueryData } from "./ElasticQuery";
import {
  elasticCloudIdSetting,
  elasticPasswordSetting,
  elasticUsernameSetting,
  isElasticEnabled,
} from "./elasticSettings";
import ElasticMultiQuery, { MultiQueryData } from "./ElasticMultiQuery";
import sortBy from "lodash/sortBy";

export type ElasticDocument = Exclude<SearchDocument, "_id">;
export type ElasticSearchHit = SearchHit<ElasticDocument>;
export type ElasticSearchResponse = SearchResponse<ElasticDocument>;

const DEBUG_LOG_ELASTIC_QUERIES = false;

let globalClient: Client | null = null;

class ElasticClient {
  private client: Client;

  constructor() {
    if (!isElasticEnabled) {
      throw new Error("Elasticsearch is not enabled");
    }

    const cloudId = elasticCloudIdSetting.get();
    const username = elasticUsernameSetting.get();
    const password = elasticPasswordSetting.get();

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

  search(queryData: QueryData): Promise<ElasticSearchResponse> {
    const query = new ElasticQuery(queryData);
    const request = query.compile();
    if (DEBUG_LOG_ELASTIC_QUERIES) {
      // eslint-disable-next-line no-console
      console.log("Elastic query:", JSON.stringify(request, null, 2));
    }
    return this.client.search(request);
  }

  async multiSearch(queryData: MultiQueryData): Promise<ElasticSearchResponse> {
    const query = new ElasticMultiQuery(queryData);
    const request = query.compile();
    if (DEBUG_LOG_ELASTIC_QUERIES) {
      // eslint-disable-next-line no-console
      console.log("Elastic multi query:", JSON.stringify(request, null, 2));
    }
    const result: ElasticSearchResponse = await this.client.search(request);

    const aggregation = result.aggregations?.indexes as undefined | {
      buckets?: {hits?: AggregationsTopHitsAggregate}[],
    };
    const allHits = (aggregation?.buckets ?? [])
      .flatMap((bucket) => bucket?.hits?.hits?.hits)
      .filter((hit): hit is SearchHit<SearchDocument> => (hit?._score ?? 0) > 0);
    const sortedHits = sortBy(allHits ?? [], ((hit) => hit._score));
    result.hits.hits = sortedHits;
    result.hits.max_score = sortedHits[0]?._score ?? null;
    delete result.aggregations;
    return result;
  }
}

export default ElasticClient;
