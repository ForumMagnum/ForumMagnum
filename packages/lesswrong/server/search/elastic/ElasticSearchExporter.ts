import { OnDropDocument } from "@elastic/elasticsearch/lib/helpers";
import { htmlToText } from "html-to-text";
import ElasticSearchClient from "./ElasticSearchClient";
import { collectionNameToConfig, Mappings } from "./ElasticSearchConfig";
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

const HTML_FIELDS = [
  "body",
  "bio",
  "howOthersCanHelpMe",
  "howICanHelpOthers",
  "plaintextDescription",
  "description",
];

class ElasticSearchExporter {
  constructor(
    private client = new ElasticSearchClient(),
  ) {}

  async configureIndexes() {
    for (const collectionName of algoliaIndexedCollectionNames) {
      await this.configureIndex(collectionName);
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
  async configureIndex(collectionName: AlgoliaIndexCollectionName) {
    const client = this.client.getClientOrThrow();
    const collection = getCollection(collectionName) as
      AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;

    const aliasName = this.getIndexName(collection);
    const newIndexName = `${aliasName}_${Date.now()}`;
    const oldIndexName = await this.getExistingAliasTarget(aliasName);

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

  async deleteIndex(collectionName: AlgoliaIndexCollectionName) {
    const client = this.client.getClientOrThrow();
    const collection = getCollection(collectionName) as
      AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;

    const aliasName = this.getIndexName(collection);
    const indexName = await this.getExistingAliasTarget(aliasName);
    if (!indexName) {
      throw new Error("Can't find backing index for collection " + collectionName);
    }

    await client.indices.delete({
      index: indexName,
    });
  }

  private formatDocument(document: AlgoliaDocument) {
    const id = document._id;
    // @ts-ignore
    delete document._id;
    document.publicDateMs = Number(document.publicDateMs);
    for (const field of HTML_FIELDS) {
      if (field in document) {
        document[field] = htmlToText(document[field] ?? "", {
          selectors: [
            {selector: "a", options: {ignoreHref: true}},
            {selector: "img", format: "skip"},
          ],
        });
      }
    }
    return {id, document};
  }

  async updateDocument(
    collectionName: AlgoliaIndexCollectionName,
    documentId: string,
  ): Promise<void> {
    const index = collectionName.toLowerCase();
    const repo = this.getRepoByCollectionName(collectionName);
    const searchDocument = await repo.getSearchDocumentById(documentId);
    await this.client.getClientOrThrow().index({
      index,
      ...this.formatDocument(searchDocument),
    });
  }

  private async getExistingAliasTarget(aliasName: string): Promise<string | null> {
    try {
      const client = this.client.getClientOrThrow();
      const existing = await client.indices.getAlias({name: aliasName});
      const oldIndexName = Object.keys(existing ?? {})[0];
      return oldIndexName ?? null;
    } catch {
      return null;
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
          index: {
            analysis: {
              filter: {
                default: {
                  type: "porter_stem",
                },
                fm_synonym_filter: {
                  type: "synonym",
                  synonyms: [
                    "will,william,william_macaskill",
                  ],
                },
              },
              analyzer: {
                default: {
                  type: "standard",
                },
                fm_synonym_analyzer: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: [
                    "lowercase",
                    "fm_synonym_filter",
                    "porter_stem",
                  ],
                },
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
    const config = collectionNameToConfig(collectionName);
    const result: Mappings = {
      objectID: {type: "keyword"},
      publicDateMs: {type: "long"},
      ...config.mappings,
    };
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

  async exportCollection(collectionName: AlgoliaIndexCollectionName) {
    const collection = getCollection(collectionName) as
      AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;
    const repo = this.getRepoByCollectionName(collectionName);

    const total = await repo.countSearchDocuments();

    // eslint-disable-next-line no-console
    console.log(`Exporting ${collectionName} (${total} documents)`);

    const batchSize = 1000;
    const totalBatches = Math.ceil(total / batchSize);
    const totalErrors: OnDropDocument<AlgoliaDocument>[] = [];
    for (let i = 0; ; i++) {
      const offset = batchSize * i;
      // eslint-disable-next-line no-console
      console.log(`...starting ${collectionName} batch ${i} of ${totalBatches}`);
      const documents = await repo.getSearchDocuments(batchSize, offset);
      if (documents.length < 1) {
        break;
      }
      const erroredDocuments = await this.createDocuments(collection, documents);
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

  private async createDocuments(
    collection: AlgoliaIndexedCollection<AlgoliaIndexedDbObject>,
    documents: AlgoliaDocument[],
  ): Promise<OnDropDocument<AlgoliaDocument>[]> {
    if (!documents.length) {
      return [];
    }
    const _index = this.getIndexName(collection);
    const erroredDocuments: OnDropDocument<AlgoliaDocument>[] = [];
    await this.client.getClientOrThrow().helpers.bulk({
      datasource: documents,
      onDocument: (document: AlgoliaDocument) => {
        const {id: _id} = this.formatDocument(document);
        return {
          create: {_index, _id},
        };
      },
      onDrop: (doc) => erroredDocuments.push(doc),
    });
    return erroredDocuments;
  }
}

Globals.elasticConfigureIndex = (collectionName: AlgoliaIndexCollectionName) =>
  new ElasticSearchExporter().configureIndex(collectionName);

Globals.elasticConfigureIndexes = () =>
  new ElasticSearchExporter().configureIndexes();

Globals.elasticExportCollection = (collectionName: AlgoliaIndexCollectionName) =>
  new ElasticSearchExporter().exportCollection(collectionName);

Globals.elasticExportAll = () =>
  new ElasticSearchExporter().exportAll();

Globals.elasticDeleteIndex = (collectionName: AlgoliaIndexCollectionName) =>
  new ElasticSearchExporter().deleteIndex(collectionName);

export default ElasticSearchExporter;
