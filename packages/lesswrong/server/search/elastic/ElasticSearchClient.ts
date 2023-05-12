import { Client } from "@elastic/elasticsearch";
import type { SearchHit, SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import {
  elasticCloudIdSetting,
  elasticUsernameSetting,
  elasticPasswordSetting,
} from "../../../lib/instanceSettings";
import ElasticSearchQuery, { QueryData } from "./ElasticSearchQuery";

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
    console.log("Connecting to ElasticSearch...");
    this.client = new Client({
      cloud: {id: cloudId},
      auth: {
        username,
        password,
      },
    });
  }

  search(queryData: QueryData): Promise<ElasticSearchResponse> {
    const query = new ElasticSearchQuery(queryData);
    const request = query.compile();
    console.log("request", require("util").inspect(request, {depth: null}));
    return this.getClientOrThrow().search(request);
  }

  getClientOrThrow() {
    if (!this.client) {
      throw new Error("ElasticSearch client not connected");
    }
    return this.client;
  }
}

export default ElasticSearchClient;
