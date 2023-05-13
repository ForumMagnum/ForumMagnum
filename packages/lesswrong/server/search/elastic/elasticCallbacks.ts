import { AlgoliaIndexCollectionName, algoliaIndexedCollectionNames } from "../../../lib/search/algoliaUtil";
import { getCollectionHooks } from "../../mutationCallbacks";
import ElasticSearchClient from "./ElasticSearchClient";
import ElasticSearchExporter from "./ElasticSearchExporter";

const syncDocument = (
  collectionName: AlgoliaIndexCollectionName,
  document: DbObject,
) => {
  try {
    const client = new ElasticSearchClient();
    if (!client.isConnected()) {
      return;
    }
    const exporter = new ElasticSearchExporter(client);
    void exporter.updateDocument(collectionName, document);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[${collectionName}] Failed to index Elasticsearch document:`, e);
  }
}

for (const collectionName of algoliaIndexedCollectionNames) {
  const callback = syncDocument.bind(null, collectionName);
  getCollectionHooks(collectionName).createAfter.add(callback);
  getCollectionHooks(collectionName).updateAfter.add(callback);
}
