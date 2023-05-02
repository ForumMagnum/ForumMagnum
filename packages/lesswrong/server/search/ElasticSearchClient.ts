import { Client } from "@elastic/elasticsearch";
import type {
  SearchHit,
  SearchResponse,
  MappingRankFeatureProperty,
} from "@elastic/elasticsearch/lib/api/types";
import {
  AlgoliaIndexCollectionName,
  algoliaIndexedCollectionNames,
} from "../../lib/search/algoliaUtil";
import {
  AlgoliaIndexedCollection,
  AlgoliaIndexedDbObject,
} from "./utils";
import {
  elasticCloudIdSetting,
  elasticUsernameSetting,
  elasticPasswordSetting,
} from "../../lib/instanceSettings";
import { forEachDocumentBatchInCollection } from "../manualMigrations/migrationUtils";
import { getAlgoliaFilter } from "./algoliaFilters";
import { OnDropDocument } from "@elastic/elasticsearch/lib/helpers";
import { getCollection } from "../../lib/vulcan-lib/getCollection";
import Globals from "../../lib/vulcan-lib/config";

export type ElasticDocument = Exclude<AlgoliaDocument, "_id">;
export type ElasticSearchHit = SearchHit<ElasticDocument>;
export type ElasticSearchResponse = SearchResponse<ElasticDocument>;

type Ranking = {
  field: string,
  order: "asc" | "desc",
  expr?: string,
}

type IndexConfig = {
  fields: string[],
  snippet: string,
  highlight?: string,
  ranking?: Ranking[],
}

type Mappings = Record<string, MappingRankFeatureProperty>;

class ElasticSearchClient {
  private static readonly configs: Record<AlgoliaIndexCollectionName, IndexConfig> = {
    Comments: {
      fields: [
        "body",
        "authorDisplayName",
        "objectID",
      ],
      snippet: "body",
      highlight: "authorDisplayName",
      ranking: [
        {field: "baseScore", order: "desc"},
      ],
    },
    Posts: {
      fields: [
        "title^3",
        "authorDisplayName",
        "body",
        "objectID",
      ],
      snippet: "body",
      highlight: "title",
      ranking: [
        {field: "order", order: "asc", expr: "abcd"/*TODO*/},
        {field: "baseScore", order: "desc"},
        {field: "score", order: "desc"},
      ],
    },
    Users: {
      fields: [
        "displayName",
        "objectID",
        "bio",
        "mapLocationAddress",
        "jobTitle",
        "organization",
        "howICanHelpOthers",
        "howOthersCanHelpMe",
      ],
      snippet: "bio",
      ranking: [
        {field: "karma", order: "desc"},
        {field: "createdAt", order: "desc", expr: "abcd"/*TODO*/},
      ],
    },
    Sequences: {
      fields: [
        "title^3",
        "plaintextDescription",
        "authorDisplayName",
        "_id",
      ],
      snippet: "plaintextDescription",
    },
    Tags: {
      fields: [
        "name^3",
        "description",
        "objectID",
      ],
      snippet: "description",
      ranking: [
        {field: "core", order: "desc", expr: "abcd"/*TODO*/},
        {field: "postCount", order: "desc"},
      ],
    },
  };

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
    const config = ElasticSearchClient.configs[collectionName];
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

  private compileRanking(ranking?: Ranking[]): {source: string} | null {
    if (!ranking?.length) {
      return null;
    }

    return {source: ""};
  }

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

  async configureIndexes() {
    for (const collectionName of algoliaIndexedCollectionNames) {
      await this.initIndex(collectionName);
    }
  }

  async exportAll() {
    await Promise.all(algoliaIndexedCollectionNames.map(async (collectionName) => {
      await this.exportCollection(collectionName);
    }));
  }

  /**
   * In ElasticSearch, the schema of indexes (called "mappings") is write-only - ie;
   * you can add new fields, but you can't remove fields or change the types of
   * existing fields. This makes experimenting with changes very annoying.
   *
   * To remedy this, we create this indexes with a name tagged with the date of
   * creation (so posts might actually be called posts_1683033972316) and then add an
   * alias for the actual name pointing to the underlining index.
   *
   * To change the schema, we then:
   *  1) Make the old index read-only
   *  2) Reindex all of the existing data into a new index with the new schema
   *  3) Mark the new index as writable
   *  4) Update the alias to point to the new index
   *  5) Delete the old index
   */
  private async initIndex(collectionName: AlgoliaIndexCollectionName) {
    const client = this.getClientOrThrow();
    const collection = getCollection(collectionName) as
      AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;

    const aliasName = this.getIndexName(collection);
    const newIndexName = `${aliasName}_${Date.now()}`;
    const mappings = this.getCollectionMappings(collectionName);
    const existing = await client.indices.getAlias({name: aliasName});
    const oldIndexName = Object.keys(existing ?? {})[0];

    if (oldIndexName) {
      // eslint-disable-next-line no-console
      console.log(`Reindexing index: ${collectionName}`);
      await client.indices.putSettings({
        index: oldIndexName,
        body: {
          "index.blocks.write": true,
        },
      });
      await client.indices.create({
        index: newIndexName,
        body: {
          mappings: {properties: mappings},
        },
      });
      await client.reindex({
        refresh: true,
        body: {
          source: {index: oldIndexName},
          dest: {index: newIndexName},
        },
      });
      await client.indices.putSettings({
        index: newIndexName,
        body: {
          "index.blocks.write": false,
        },
      });
      await client.indices.putAlias({
        index: newIndexName,
        name: aliasName,
      });
      await client.indices.delete({
        index: oldIndexName,
      });
    } else {
      // eslint-disable-next-line no-console
      console.log(`Creating index: ${collectionName}`);
      await client.indices.create({
        index: newIndexName,
        body: {
          mappings: {properties: mappings},
        },
      });
      await client.indices.putAlias({
        index: newIndexName,
        name: aliasName,
      });
    }
  }

  private getCollectionMappings(collectionName: AlgoliaIndexCollectionName): Mappings {
    const config = ElasticSearchClient.configs[collectionName];
    if (!config) {
      throw new Error("Config not found for collection " + collectionName);
    }

    const result: Record<string, MappingRankFeatureProperty> = {};
    /*
    const rankings = config.ranking ?? [];
    for (const ranking of rankings) {
      if (ranking.expr) {
        continue;
      }
      result[ranking.field] = {
        type: "rank_feature",
        positive_score_impact: ranking.order === "desc",
      };
    }
    */
    return result;
  }

  private async exportCollection(collectionName: AlgoliaIndexCollectionName) {
    const collection = getCollection(collectionName) as
      AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;
    const filter = getAlgoliaFilter(collectionName);

    const total = await collection.find(filter).count();

    // eslint-disable-next-line no-console
    console.log(`Exporting ${collectionName}`);

    const totalErrors: OnDropDocument<AlgoliaDocument>[] = [];
    let exportedSoFar = 0;
    await forEachDocumentBatchInCollection({
      collection,
      filter,
      batchSize: 500,
      loadFactor: 0.5,
      callback: async (documents: AlgoliaIndexedDbObject[]) => {
        const importBatch: AlgoliaDocument[] = [];
        const itemsToDelete: string[] = [];

        for (const document of documents) {
          const canAccess = collection.checkAccess
            ? await collection.checkAccess(null, document, null)
            : true;
          const entries: AlgoliaDocument[]|null = canAccess
            ? await collection.toAlgolia(document)
            : null;

          if (entries?.length) {
            importBatch.push.apply(importBatch, entries);
          } else {
            itemsToDelete.push(document._id);
          }
        }

        const erroredDocuments = await this.pushDocuments(collection, importBatch);
        totalErrors.push.apply(totalErrors, erroredDocuments);

        await this.deleteDocuments(collection, itemsToDelete);

        exportedSoFar += documents.length;

        // eslint-disable-next-line no-console
        console.log(`Exported ${exportedSoFar}/${total} from ${collectionName}`);
      }
    });

    if (totalErrors.length) {
      // eslint-disable-next-line no-console
      console.error(`${collectionName} indexing errors:`, totalErrors);
    } else {
      // eslint-disable-next-line no-console
      console.log("No errors found when indexing", collectionName)
    }
  }

  private getIndexName(collection: AlgoliaIndexedCollection<AlgoliaIndexedDbObject>) {
    return collection.collectionName.toLowerCase();
  }

  private getClientOrThrow() {
    if (!this.client) {
      throw new Error("ElasticSearch client not connected");
    }
    return this.client;
  }

  private async pushDocuments(
    collection: AlgoliaIndexedCollection<AlgoliaIndexedDbObject>,
    documents: AlgoliaDocument[],
  ): Promise<OnDropDocument<AlgoliaDocument>[]> {
    if (!documents.length) {
      return [];
    }

    // eslint-disable-next-line no-console
    console.log("...pushing", documents.length, "documents");

    const _index = this.getIndexName(collection);
    const erroredDocuments: OnDropDocument<AlgoliaDocument>[] = [];
    await this.getClientOrThrow().helpers.bulk({
      datasource: documents,
      onDocument: (document: AlgoliaDocument) => {
        const {_id} = document;
        // @ts-ignore
        delete document._id;
        return {
          create: {_index, _id},
        };
      },
      onDrop: (doc) => erroredDocuments.push(doc),
    });
    return erroredDocuments;
  }

  private async deleteDocuments(
    collection: AlgoliaIndexedCollection<AlgoliaIndexedDbObject>,
    documentIds: string[],
  ) {
    if (!documentIds.length) {
      return;
    }

    // TODO
    void collection;
  }
}

Globals.elasticConfigureIndexes = () => new ElasticSearchClient().configureIndexes();
Globals.elasticExportAll = () => new ElasticSearchClient().exportAll();

export default ElasticSearchClient;
