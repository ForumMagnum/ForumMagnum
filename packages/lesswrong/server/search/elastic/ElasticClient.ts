import { Client } from "@elastic/elasticsearch";
import type { SearchHit, SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import ElasticQuery, { QueryData } from "./ElasticQuery";
import {
  elasticCloudIdSetting,
  elasticPasswordSetting,
  elasticUsernameSetting,
  isElasticEnabled,
} from "./elasticSettings";
import { isAnyTest } from "../../../lib/executionEnvironment";

export type ElasticDocument = Exclude<AlgoliaDocument, "_id">;
export type ElasticSearchHit = SearchHit<ElasticDocument>;
export type ElasticSearchResponse = SearchResponse<ElasticDocument>;

let globalClient: Client | null = null;

class ElasticClient {
  private client: Client;

  constructor() {
    if (isAnyTest) {
      return;
    }

    if (!isElasticEnabled) {
      throw new Error("Elasticsearch is not enabled");
    }

    const cloudId = elasticCloudIdSetting.get();
    const username = elasticUsernameSetting.get();
    const password = elasticPasswordSetting.get();

    if (!cloudId || !username || !password) {
      throw new Error("Elasticsearch credentials are not configured");
    }

    if (!globalClient) {
      // eslint-disable-next-line no-console
      console.log("Connecting to Elasticsearch...");
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
    return this.client.search(request);
  }
}

export default ElasticClient;
