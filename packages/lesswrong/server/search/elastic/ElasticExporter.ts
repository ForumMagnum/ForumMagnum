import { OnDropDocument } from "@elastic/elasticsearch/lib/helpers";
import { htmlToText } from "html-to-text";
import ElasticSearchClient from "./ElasticClient";
import { collectionNameToConfig, Mappings } from "./ElasticConfig";
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
    await Promise.all(algoliaIndexedCollectionNames.map(
      (collectionName) => this.exportCollection(collectionName),
    ));
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
      const synonyms = await this.getExistingSynonyms();
      await client.indices.putSettings({
        index: oldIndexName,
        body: {
          "index.blocks.write": true,
        },
      });
      await this.createIndex(newIndexName, collectionName);
      await this.updateSynonymsForIndex(newIndexName, synonyms);
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
    // We could strip the HTML inside elastic with the "html_strip" filter, but this
    // is a lot more flexible
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
                fm_synonym_filter: {
                  type: "synonym",
                  synonyms: [],
                },
              },
              char_filter: {
                fm_punctuation_filter: {
                  type: "mapping",
                  mappings: [
                    "_ => ",
                    "- => ",
                    "( => ",
                    ") => ",
                  ],
                },
              },
              analyzer: {
                default: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: [
                    "lowercase",
                    "porter_stem",
                  ],
                  char_filter: [
                    "fm_punctuation_filter",
                  ],
                },
                fm_synonym_analyzer: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: [
                    "lowercase",
                    "fm_synonym_filter",
                    "porter_stem",
                  ],
                  char_filter: [
                    "fm_punctuation_filter",
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

  async getExistingSynonyms(): Promise<string[]> {
    const client = this.client.getClientOrThrow();
    const settings = await client.indices.getSettings({
      index: "posts", // All the indexes use the same synonym list
    });
    const indexName = Object.keys(settings)[0]; // Get the alias target
    const filters = settings[indexName]?.settings?.index?.analysis?.filter;
    const synonymFilter = filters?.fm_synonym_filter;
    if (typeof synonymFilter === "string" || synonymFilter?.type !== "synonym") {
      throw new Error("Invalid synonym filter");
    }
    return synonymFilter.synonyms ?? [];
  }

  async updateSynonyms(synonyms: string[]): Promise<void> {
    await Promise.all(algoliaIndexedCollectionNames.map(
      (collectionName) => this.updateSynonymsForCollection(collectionName, synonyms),
    ));
  }

  private async updateSynonymsForCollection(
    collectionName: AlgoliaIndexCollectionName,
    synonyms: string[],
  ) {
    const collection = getCollection(collectionName) as
      AlgoliaIndexedCollection<AlgoliaIndexedDbObject>;
    const index = this.getIndexName(collection);
    await this.updateSynonymsForIndex(index, synonyms);
  }

  private async updateSynonymsForIndex(index: string, synonyms: string[]) {
    const client = this.client.getClientOrThrow();
    await client.indices.close({index});
    await client.indices.putSettings({
      index,
      body: {
        settings: {
          index: {
            analysis: {
              filter: {
                fm_synonym_filter: {
                  type: "synonym",
                  synonyms,
                },
              },
            },
          },
        },
      },
    });
    await client.indices.open({index});
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
