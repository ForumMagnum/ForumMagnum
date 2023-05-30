import { Client } from "@elastic/elasticsearch";
import type { SearchHit, SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import { PublicInstanceSetting } from "../../../lib/instanceSettings";
import ElasticSearchQuery, { QueryData } from "./ElasticQuery";

const elasticCloudIdSetting = new PublicInstanceSetting<string|null>(
  "elasticsearch.cloudId",
  null,
  "optional",
);
const elasticUsernameSetting = new PublicInstanceSetting<string|null>(
  "elasticsearch.username",
  null,
  "optional",
);
const elasticPasswordSetting = new PublicInstanceSetting<string|null>(
  "elasticsearch.password",
  null,
  "optional",
);

export type ElasticDocument = Exclude<AlgoliaDocument, "_id">;
export type ElasticSearchHit = SearchHit<ElasticDocument>;
export type ElasticSearchResponse = SearchResponse<ElasticDocument>;

class ElasticSearchClient {
  private client: Client;

  constructor() {
    const cloudId = elasticCloudIdSetting.get();
    const username = elasticUsernameSetting.get();
    const password = elasticPasswordSetting.get();

    if (!cloudId || !username || !password) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log("Connecting to Elasticsearch...");
    this.client = new Client({
      requestTimeout: 600000,
      cloud: {id: cloudId},
      auth: {
        username,
        password,
      },
    });
  }

  isConnected(): boolean {
    return Boolean(this.client);
  }

  search(queryData: QueryData): Promise<ElasticSearchResponse> {
    const query = new ElasticSearchQuery(queryData);
    const request = query.compile();
    return this.getClientOrThrow().search(request);
  }

  getClientOrThrow() {
    if (!this.client) {
      throw new Error("Elasticsearch client not connected");
    }
    return this.client;
  }
}

export default ElasticSearchClient;
