import { Client } from "@elastic/elasticsearch";
import type { SearchHit, SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import { AlgoliaIndexCollectionName } from "../../lib/search/algoliaUtil";
import {
  elasticCloudIdSetting,
  elasticUsernameSetting,
  elasticPasswordSetting,
} from "../../lib/instanceSettings";
import { elasticSearchConfig } from "./ElasticSearchConfig";

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

  search({index, search, offset = 0, limit = 10, preTag, postTag}: {
    index: string,
    search: string
    offset?: number,
    limit?: number,
    preTag?: string,
    postTag?: string,
  }): Promise<ElasticSearchResponse> {
    const collectionName = this.indexToCollectionName(index);
    const config = elasticSearchConfig[collectionName];
    if (!config) {
      throw new Error("Config not found for index " + index);
    }
    const tags = {
      pre_tags: [preTag ?? "<em>"],
      post_tags: [postTag ?? "</em>"],
    };
    return this.getClientOrThrow().search({
      index,
      query: {
        script_score: {
          query: {
            simple_query_string: {
              query: search,
              fields: config.fields,
              default_operator: "and",
            },
          },
          script: {
            source: "_score * saturation(doc['baseScore'].value, 10)",
          },
        },
      },
      highlight: {
        fields: {
          [config.snippet]: tags,
          ...(config.highlight && {[config.highlight]: tags}),
        },
      },
      from: offset,
      size: limit,
    });
  }

  // private compileRanking(ranking?: Ranking[]): {source: string} | null {
    // if (!ranking?.length) {
      // return null;
    // }

    // return {source: ""};
  // }

  private indexToCollectionName(index: string): AlgoliaIndexCollectionName {
    const data: Record<string, AlgoliaIndexCollectionName> = {
      comments: "Comments",
      posts: "Posts",
      users: "Users",
      sequences: "Sequences",
      tags: "Tags",
    };
    if (!data[index]) {
      throw new Error("Invalid index name: " + index);
    }
    return data[index];
  }

  getClientOrThrow() {
    if (!this.client) {
      throw new Error("ElasticSearch client not connected");
    }
    return this.client;
  }
}

export default ElasticSearchClient;
