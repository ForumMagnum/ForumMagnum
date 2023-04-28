import { Client } from "@elastic/elasticsearch";
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

  async exportAll() {
    await Promise.all(algoliaIndexedCollectionNames.map(async (collectionName) => {
      await this.initIndex(collectionName);
      await this.exportCollection(collectionName);
    }));
  }

  async initIndex(collectionName: AlgoliaIndexCollectionName) {
    const client = this.getClientOrThrow();
    const collection = getCollection(collectionName) as
      AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;
    // eslint-disable-next-line no-console
    console.log(`Creating index: ${collectionName}`);
    await client.indices.create({
      index: this.getIndexName(collection),
    }, {ignore: [400]});
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

Globals.elasticExportAll = () => new ElasticSearchClient().exportAll();

export default ElasticSearchClient;
