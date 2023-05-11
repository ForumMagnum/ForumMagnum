import { OnDropDocument } from "@elastic/elasticsearch/lib/helpers";
import type { MappingRankFeatureProperty } from "@elastic/elasticsearch/lib/api/types";
import ElasticSearchClient from "./ElasticSearchClient";
import { elasticSearchConfig } from "./ElasticSearchConfig";
import {
  AlgoliaIndexCollectionName,
  algoliaIndexedCollectionNames,
} from "../../../lib/search/algoliaUtil";
import {
  AlgoliaIndexedCollection,
  AlgoliaIndexedDbObject,
} from "../utils";
import {
  CommentsRepo,
  PostsRepo,
  SequencesRepo,
  TagsRepo,
  UsersRepo,
} from "../../repos";
import { getCollection } from "../../../lib/vulcan-lib/getCollection";
import Globals from "../../../lib/vulcan-lib/config";

export type Mappings = Record<string, MappingRankFeatureProperty>;

class ElasticSearchExporter {
  private client = new ElasticSearchClient();

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
    const client = this.client.getClientOrThrow();
    const collection = getCollection(collectionName) as
      AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;

    const aliasName = this.getIndexName(collection);
    const newIndexName = `${aliasName}_${Date.now()}`;
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
      await this.createIndex(newIndexName, collectionName);
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
      await this.createIndex(newIndexName, collectionName);
      await client.indices.putAlias({
        index: newIndexName,
        name: aliasName,
      });
    }
  }

  private async createIndex(
    indexName: string,
    collectionName: AlgoliaIndexCollectionName,
  ): Promise<void> {
    const client = this.client.getClientOrThrow();
    const mappings = this.getCollectionMappings(collectionName);
    await client.indices.create({
      index: indexName,
      body: {
        settings: {
          analysis: {
            // analyzer: {
              // default: {
                // type: "language",
                // language: "English",
                // stem_exclusion: [],
              // },
            // },
            filter: {
              default: {
                type: "porter_stem",
              },
            },
          },
        },
        mappings: {
          properties: mappings,
        },
      },
    });
  }

  private getCollectionMappings(
    collectionName: AlgoliaIndexCollectionName,
  ): Mappings {
    const config = elasticSearchConfig[collectionName];
    if (!config) {
      throw new Error("Config not found for collection " + collectionName);
    }
    const result: Record<string, MappingRankFeatureProperty> = {};
    return result;
  }

  private getRepoByCollectionName(collectionName: AlgoliaIndexCollectionName) {
    switch (collectionName) {
    case "Posts":
      return new PostsRepo();
    case "Comments":
      return new CommentsRepo();
    case "Users":
      return new UsersRepo();
    case "Sequences":
      return new SequencesRepo();
    case "Tags":
      return new TagsRepo();
    default:
      throw new Error("Can't find repo for collection " + collectionName);
    }
  }

  private async exportCollection(collectionName: AlgoliaIndexCollectionName) {
    const collection = getCollection(collectionName) as
      AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;
    const repo = this.getRepoByCollectionName(collectionName);

    const total = await repo.countSearchDocuments();

    // eslint-disable-next-line no-console
    console.log(`Exporting ${collectionName} (${total} documents)`);

    const batchSize = 500;
    const totalBatches = Math.ceil(total / batchSize);
    const totalErrors: OnDropDocument<AlgoliaDocument>[] = [];
    for (let i = 0; ; i++) {
      const offset = batchSize * i;
      console.log(`...starting ${collectionName} batch ${i} of ${totalBatches}`);
      const documents = await repo.getSearchDocuments(batchSize, offset);
      if (documents.length < 1) {
        break;
      }
      const erroredDocuments = await this.pushDocuments(collection, documents);
      totalErrors.push.apply(totalErrors, erroredDocuments);
    }

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
    await this.client.getClientOrThrow().helpers.bulk({
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

  // TODO
  /*
  private async deleteDocuments(
    collection: AlgoliaIndexedCollection<AlgoliaIndexedDbObject>,
    documentIds: string[],
  ) {
    if (!documentIds.length) {
      return;
    }
    void collection;
  }
  */
}

Globals.elasticConfigureIndexes = () =>
  new ElasticSearchExporter().configureIndexes();

Globals.elasticExportAll = () =>
  new ElasticSearchExporter().exportAll();

export default ElasticSearchExporter;
